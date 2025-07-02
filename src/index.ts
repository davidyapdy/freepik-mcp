#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { URLSearchParams } from "url";

interface FreepikResource {
  id: string;
  title: string;
  url: string;
  image: {
    source: {
      url: string;
    };
  };
  author: {
    username: string;
  };
  license: string;
}

interface FreepikResponse {
  data: FreepikResource[];
  meta: {
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
    clean_search: boolean;
  };
}

interface FreepikIcon {
  id: number;
  name: string;
  thumbnails: {
    png: string;
    svg: string;
  };
  author: {
    username: string;
  };
  tags: string[];
  family: {
    id: number;
    name: string;
  };
}

interface FreepikIconResponse {
  data: FreepikIcon[];
  meta: {
    pagination: {
      current_page: number;
      per_page: number;
      last_page: number;
      total: number;
    };
  };
}

interface FreepikDownloadResponse {
  data: {
    filename: string;
    url: string;
  };
}

interface FreepikIconGenerationResponse {
  task_id: string;
  task_status: string;
  generated?: string[];
}

interface FreepikIconGenerationRequest {
  prompt: string;
  webhook_url: string;
  format?: string;
  style?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
}

interface FreepikMysticRequest {
  prompt: string;
  webhook_url?: string;
  structure_reference?: string;
  style_reference?: string;
  resolution?: string;
  aspect_ratio?: string;
  model?: string;
}

interface FreepikFluxDevRequest {
  prompt: string;
  webhook_url?: string;
  aspect_ratio?: string;
  styling?: {
    effects?: string[];
    color?: string;
  };
  seed?: number;
}

interface FreepikReimagineFluxRequest {
  image: string;
  prompt?: string;
  webhook_url?: string;
  imagination?: string;
  aspect_ratio?: string;
}

interface FreepikAITaskResponse {
  data: {
    task_id: string;
    status: string;
    generated?: string[];
    has_nsfw?: boolean;
  };
}

interface FreepikAITasksResponse {
  data: Array<{
    task_id: string;
    status: string;
  }>;
}

interface FreepikImageUpscalerRequest {
  image: string;
  webhook_url?: string;
  scale_factor?: string;
  optimized_for?: string;
  prompt?: string;
  creativity?: number;
  hdr?: number;
  resemblance?: number;
  fractality?: number;
  engine?: string;
}

interface FreepikRemoveBackgroundResponse {
  original: string;
  high_resolution: string;
  preview: string;
  url: string;
}

interface FreepikImageExpandRequest {
  image: string;
  prompt?: string;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  webhook_url?: string;
}

class FreepikMCPServer {
  private server: Server;
  private apiKey: string;
  private baseUrl = "https://api.freepik.com/v1";

  constructor() {
    this.server = new Server(
      {
        name: "freepik-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiKey = process.env.FREEPIK_API_KEY || "";
    if (!this.apiKey) {
      console.error("FREEPIK_API_KEY environment variable is required");
      process.exit(1);
    }

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "search_resources",
          description: "Search for Freepik resources (images, vectors, PSDs) with various filters",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for resources",
              },
              page: {
                type: "number",
                description: "Page number for pagination (default: 1)",
                default: 1,
              },
              limit: {
                type: "number",
                description: "Number of results per page (default: 20, max: 200)",
                default: 20,
              },
              orientation: {
                type: "string",
                enum: ["landscape", "portrait", "square", "panoramic"],
                description: "Image orientation filter",
              },
              order: {
                type: "string",
                enum: ["relevance", "recent"],
                description: "Sort order for results (default: relevance)",
              },
              license: {
                type: "string",
                enum: ["freemium", "premium"],
                description: "License type filter",
              },
              people_number: {
                type: "string",
                enum: ["none", "one", "two", "group"],
                description: "Number of people in the image",
              },
              people_ethnicity: {
                type: "string",
                enum: ["caucasian", "hispanic", "asian", "african", "middle_eastern", "native_american", "pacific_islander", "mixed"],
                description: "Ethnicity filter for people in images",
              },
              ai_generated: {
                type: "boolean",
                description: "Filter for AI-generated content",
              },
              content_type: {
                type: "string",
                enum: ["photo", "vector", "psd"],
                description: "Type of content to search for",
              },
              color: {
                type: "string",
                description: "Color filter (hex code without #, e.g., 'ff0000' for red)",
              },
              people_age: {
                type: "string",
                enum: ["infants", "children", "teenagers", "twenties", "thirties", "forties", "fifties", "sixties", "older"],
                description: "Age group filter for people in images",
              },
              people_gender: {
                type: "string",
                enum: ["male", "female"],
                description: "Gender filter for people in images",
              },
            },
            required: [],
          },
        },
        {
          name: "search_icons",
          description: "Search for Freepik icons with various filters",
          inputSchema: {
            type: "object",
            properties: {
              term: {
                type: "string",
                description: "Search term for icons",
              },
              slug: {
                type: "string",
                description: "Search by icon slug",
              },
              page: {
                type: "number",
                description: "Page number for pagination (default: 1)",
                default: 1,
              },
              per_page: {
                type: "number",
                description: "Number of results per page (default: 20)",
                default: 20,
              },
              family_id: {
                type: "number",
                description: "Specific icon family ID",
              },
              order: {
                type: "string",
                enum: ["relevance", "recent"],
                description: "Sort order for results (default: relevance)",
              },
              color: {
                type: "string",
                description: "Color filter (e.g., red, blue, multicolor)",
              },
              shape: {
                type: "string",
                enum: ["outline", "fill"],
                description: "Icon style filter",
              },
              free_svg: {
                type: "boolean",
                description: "Filter for free SVG icons",
              },
            },
            required: [],
          },
        },
        {
          name: "download_icon",
          description: "Download a Freepik icon in specified format and size",
          inputSchema: {
            type: "object",
            properties: {
              icon_id: {
                type: "number",
                description: "Unique icon resource ID",
              },
              format: {
                type: "string",
                enum: ["svg", "png", "gif", "mp4", "aep", "json", "psd", "eps"],
                description: "Download format (default: svg)",
                default: "svg",
              },
              png_size: {
                type: "number",
                enum: [512, 256, 128, 64, 32, 24, 16],
                description: "PNG size in pixels (default: 512, only applies to PNG format)",
                default: 512,
              },
            },
            required: ["icon_id"],
          },
        },
        {
          name: "download_resource",
          description: "Download a Freepik resource (photo, vector, PSD) by ID",
          inputSchema: {
            type: "object",
            properties: {
              resource_id: {
                type: "string",
                description: "Unique resource ID",
              },
              image_size: {
                type: "string",
                enum: ["small", "medium", "large", "original"],
                description: "Resize photo while maintaining aspect ratio (default: original)",
                default: "original",
              },
            },
            required: ["resource_id"],
          },
        },
        {
          name: "download_resource_format",
          description: "Download a Freepik resource in a specific format",
          inputSchema: {
            type: "object",
            properties: {
              resource_id: {
                type: "string",
                description: "Unique resource ID",
              },
              format: {
                type: "string",
                enum: ["psd", "ai", "eps", "png", "jpg", "svg"],
                description: "Desired download format",
              },
            },
            required: ["resource_id", "format"],
          },
        },
        {
          name: "generate_icon",
          description: "Generate AI icons from text prompts using Freepik AI",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "Text description for icon generation",
              },
              webhook_url: {
                type: "string",
                description: "URL to receive task results",
              },
              format: {
                type: "string",
                enum: ["png", "svg"],
                description: "Output format (default: png)",
                default: "png",
              },
              style: {
                type: "string",
                enum: ["solid", "outline", "color", "flat", "sticker"],
                description: "Icon style",
              },
              num_inference_steps: {
                type: "number",
                minimum: 10,
                maximum: 50,
                description: "Generation complexity (10-50)",
              },
              guidance_scale: {
                type: "number",
                minimum: 0,
                maximum: 10,
                description: "Generation precision (0-10)",
              },
            },
            required: ["prompt", "webhook_url"],
          },
        },
        {
          name: "generate_icon_preview",
          description: "Generate AI icon previews from text prompts",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "Text description for icon generation",
              },
              webhook_url: {
                type: "string",
                description: "URL to receive task results",
              },
              style: {
                type: "string",
                enum: ["solid", "outline", "color", "flat", "sticker"],
                description: "Icon style",
              },
              num_inference_steps: {
                type: "number",
                minimum: 10,
                maximum: 50,
                description: "Generation complexity (10-50)",
              },
              guidance_scale: {
                type: "number",
                minimum: 0,
                maximum: 10,
                description: "Generation precision (0-10)",
              },
            },
            required: ["prompt", "webhook_url"],
          },
        },
        {
          name: "render_generated_icon",
          description: "Download generated AI icon in specified format",
          inputSchema: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "Unique identifier for the icon generation task",
              },
              format: {
                type: "string",
                enum: ["png", "svg"],
                description: "Download format",
                default: "png",
              },
            },
            required: ["task_id", "format"],
          },
        },
        {
          name: "generate_mystic",
          description: "Generate high-resolution images using Freepik's Mystic AI workflow",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "Text description of desired image",
              },
              webhook_url: {
                type: "string",
                description: "Optional callback URL for task status updates",
              },
              structure_reference: {
                type: "string",
                description: "Base64 image to influence image shape",
              },
              style_reference: {
                type: "string",
                description: "Base64 image to influence image aesthetic",
              },
              resolution: {
                type: "string",
                enum: ["1k", "2k", "4k"],
                description: "Image resolution",
              },
              aspect_ratio: {
                type: "string",
                enum: ["square_1_1", "widescreen_16_9", "classic_4_3", "social_story_9_16"],
                description: "Image aspect ratio",
              },
              model: {
                type: "string",
                enum: ["realism", "fluid", "zen"],
                description: "Generation model type",
              },
            },
            required: ["prompt"],
          },
        },
        {
          name: "get_mystic_task",
          description: "Get status and results of a Mystic generation task",
          inputSchema: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "Unique identifier for the Mystic task",
              },
            },
            required: ["task_id"],
          },
        },
        {
          name: "list_mystic_tasks",
          description: "List all Mystic generation tasks",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "generate_flux_dev",
          description: "Generate images using Flux Dev AI model",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "Text description of desired image",
              },
              webhook_url: {
                type: "string",
                description: "Optional callback URL for task status updates",
              },
              aspect_ratio: {
                type: "string",
                enum: ["square_1_1", "classic_4_3", "widescreen_16_9", "social_story_9_16"],
                description: "Image aspect ratio (default: square_1_1)",
                default: "square_1_1",
              },
              styling: {
                type: "object",
                properties: {
                  effects: {
                    type: "array",
                    items: { type: "string" },
                    description: "Visual effects (color, framing, lightning)",
                  },
                  color: {
                    type: "string",
                    description: "Custom color palette",
                  },
                },
                description: "Styling options for the generated image",
              },
              seed: {
                type: "number",
                description: "Specific seed for image generation",
              },
            },
            required: ["prompt"],
          },
        },
        {
          name: "get_flux_dev_task",
          description: "Get status and results of a Flux Dev generation task",
          inputSchema: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "Unique identifier for the Flux Dev task",
              },
            },
            required: ["task_id"],
          },
        },
        {
          name: "list_flux_dev_tasks",
          description: "List all Flux Dev generation tasks",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "reimagine_flux",
          description: "Reimagine existing images using Flux AI (Beta)",
          inputSchema: {
            type: "object",
            properties: {
              image: {
                type: "string",
                description: "Base64 encoded image",
              },
              prompt: {
                type: "string",
                description: "Optional text description for image generation",
              },
              webhook_url: {
                type: "string",
                description: "Optional callback URL for task status updates",
              },
              imagination: {
                type: "string",
                enum: ["wild", "subtle", "vivid"],
                description: "Creativity level for reimagining",
              },
              aspect_ratio: {
                type: "string",
                enum: ["original", "square_1_1", "classic_4_3", "widescreen_16_9", "social_story_9_16"],
                description: "Image aspect ratio (default: original)",
                default: "original",
              },
            },
            required: ["image"],
          },
        },
        {
          name: "upscale_image",
          description: "Upscale images using AI image upscaler",
          inputSchema: {
            type: "object",
            properties: {
              image: {
                type: "string",
                description: "Base64 encoded image to upscale (max 25.3 million pixels)",
              },
              webhook_url: {
                type: "string",
                description: "Optional callback URL for task notifications",
              },
              scale_factor: {
                type: "string",
                enum: ["2x", "4x", "8x", "16x"],
                description: "Image scaling factor",
              },
              optimized_for: {
                type: "string",
                enum: ["standard", "soft_portraits", "art_n_illustration"],
                description: "Optimization style",
              },
              prompt: {
                type: "string",
                description: "Guide the upscaling process",
              },
              creativity: {
                type: "number",
                minimum: -10,
                maximum: 10,
                description: "AI creativity level (-10 to 10)",
              },
              hdr: {
                type: "number",
                minimum: -10,
                maximum: 10,
                description: "Detail/definition level (-10 to 10)",
              },
              resemblance: {
                type: "number",
                minimum: -10,
                maximum: 10,
                description: "Original image similarity (-10 to 10)",
              },
              fractality: {
                type: "number",
                minimum: -10,
                maximum: 10,
                description: "Prompt strength per pixel (-10 to 10)",
              },
              engine: {
                type: "string",
                description: "Specific Magnific model (e.g., 'magnific_sparkle')",
              },
            },
            required: ["image"],
          },
        },
        {
          name: "get_upscaler_task",
          description: "Get status and results of an image upscaler task",
          inputSchema: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "Unique identifier for the upscaler task",
              },
            },
            required: ["task_id"],
          },
        },
        {
          name: "list_upscaler_tasks",
          description: "List all image upscaler tasks",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "remove_background",
          description: "Remove background from an image (Beta)",
          inputSchema: {
            type: "object",
            properties: {
              image_url: {
                type: "string",
                description: "URL of the image to process",
              },
            },
            required: ["image_url"],
          },
        },
        {
          name: "expand_image",
          description: "Expand an image using AI Flux Pro model",
          inputSchema: {
            type: "object",
            properties: {
              image: {
                type: "string",
                description: "Base64 encoded image",
              },
              prompt: {
                type: "string",
                description: "Text description guiding expansion",
              },
              left: {
                type: "number",
                minimum: 0,
                maximum: 2048,
                description: "Pixels to expand left (max 2048)",
              },
              right: {
                type: "number",
                minimum: 0,
                maximum: 2048,
                description: "Pixels to expand right (max 2048)",
              },
              top: {
                type: "number",
                minimum: 0,
                maximum: 2048,
                description: "Pixels to expand top (max 2048)",
              },
              bottom: {
                type: "number",
                minimum: 0,
                maximum: 2048,
                description: "Pixels to expand bottom (max 2048)",
              },
              webhook_url: {
                type: "string",
                description: "Optional callback URL for task status updates",
              },
            },
            required: ["image"],
          },
        },
        {
          name: "get_expand_task",
          description: "Get status and results of an image expand task",
          inputSchema: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "Unique identifier for the expand task",
              },
            },
            required: ["task_id"],
          },
        },
        {
          name: "list_expand_tasks",
          description: "List all image expand tasks",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "get_resource_details",
          description: "Get detailed information about a specific Freepik resource",
          inputSchema: {
            type: "object",
            properties: {
              resource_id: {
                type: "string",
                description: "The ID of the resource to get details for",
              },
            },
            required: ["resource_id"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_resources":
            return await this.searchResources(args);
          case "search_icons":
            return await this.searchIcons(args);
          case "download_icon":
            return await this.downloadIcon(args);
          case "download_resource":
            return await this.downloadResource(args);
          case "download_resource_format":
            return await this.downloadResourceFormat(args);
          case "generate_icon":
            return await this.generateIcon(args);
          case "generate_icon_preview":
            return await this.generateIconPreview(args);
          case "render_generated_icon":
            return await this.renderGeneratedIcon(args);
          case "generate_mystic":
            return await this.generateMystic(args);
          case "get_mystic_task":
            return await this.getMysticTask(args);
          case "list_mystic_tasks":
            return await this.listMysticTasks(args);
          case "generate_flux_dev":
            return await this.generateFluxDev(args);
          case "get_flux_dev_task":
            return await this.getFluxDevTask(args);
          case "list_flux_dev_tasks":
            return await this.listFluxDevTasks(args);
          case "reimagine_flux":
            return await this.reimagineFlux(args);
          case "upscale_image":
            return await this.upscaleImage(args);
          case "get_upscaler_task":
            return await this.getUpscalerTask(args);
          case "list_upscaler_tasks":
            return await this.listUpscalerTasks(args);
          case "remove_background":
            return await this.removeBackground(args);
          case "expand_image":
            return await this.expandImage(args);
          case "get_expand_task":
            return await this.getExpandTask(args);
          case "list_expand_tasks":
            return await this.listExpandTasks(args);
          case "get_resource_details":
            return await this.getResourceDetails(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async searchResources(args: any) {
    const {
      query = "",
      page = 1,
      limit = 20,
      orientation,
      order,
      license,
      content_type,
      color,
      people_age,
      people_gender,
      people_number,
      people_ethnicity,
      ai_generated,
    } = args;

    const params = new URLSearchParams();
    if (query) params.append("term", query);
    params.append("page", page.toString());
    params.append("limit", Math.min(limit, 200).toString());
    if (orientation) params.append("orientation", orientation);
    if (order) params.append("order", order);
    if (license) params.append("license", license);
    if (content_type) params.append("content_type", content_type);
    if (color) params.append("color", color);
    if (people_age) params.append("people_age", people_age);
    if (people_gender) params.append("people_gender", people_gender);
    if (people_number) params.append("people_number", people_number);
    if (people_ethnicity) params.append("people_ethnicity", people_ethnicity);
    if (ai_generated !== undefined) params.append("ai_generated", ai_generated.toString());

    const response = await axios.get<FreepikResponse>(
      `${this.baseUrl}/resources?${params.toString()}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const resources = response.data.data.map((resource: FreepikResource) => ({
      id: resource.id,
      title: resource.title,
      url: resource.url,
      image_url: resource.image.source.url,
      author: resource.author.username,
      license: resource.license,
    }));

    return {
      content: [
        {
          type: "text",
          text: `Found ${response.data.meta.total} resources (showing page ${response.data.meta.current_page} of ${response.data.meta.last_page}):\n\n${resources
            .map(
              (r: any) =>
                `**${r.title}**\n- ID: ${r.id}\n- Author: ${r.author}\n- License: ${r.license}\n- Image: ${r.image_url}\n- URL: ${r.url}`
            )
            .join("\n\n")}`,
        },
      ],
    };
  }

  private async searchIcons(args: any) {
    const {
      term,
      slug,
      page = 1,
      per_page = 20,
      family_id,
      order,
      color,
      shape,
      free_svg,
    } = args;

    const params = new URLSearchParams();
    if (term) params.append("term", term);
    if (slug) params.append("slug", slug);
    params.append("page", page.toString());
    params.append("per_page", per_page.toString());
    if (family_id) params.append("family-id", family_id.toString());
    if (order) params.append("order", order);
    if (color) params.append("color", color);
    if (shape) params.append("shape", shape);
    if (free_svg !== undefined) params.append("free_svg", free_svg.toString());

    const response = await axios.get<FreepikIconResponse>(
      `${this.baseUrl}/icons?${params.toString()}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const icons = response.data.data.map((icon: FreepikIcon) => ({
      id: icon.id,
      name: icon.name,
      png_url: icon.thumbnails.png,
      svg_url: icon.thumbnails.svg,
      author: icon.author.username,
      tags: icon.tags.join(", "),
      family: icon.family.name,
    }));

    return {
      content: [
        {
          type: "text",
          text: `Found ${response.data.meta.pagination.total} icons (showing page ${response.data.meta.pagination.current_page} of ${response.data.meta.pagination.last_page}):\n\n${icons
            .map(
              (i: any) =>
                `**${i.name}**\n- ID: ${i.id}\n- Author: ${i.author}\n- Family: ${i.family}\n- Tags: ${i.tags}\n- PNG: ${i.png_url}\n- SVG: ${i.svg_url}`
            )
            .join("\n\n")}`,
        },
      ],
    };
  }

  private async downloadIcon(args: any) {
    const { icon_id, format = "svg", png_size = 512 } = args;

    const params = new URLSearchParams();
    if (format) params.append("format", format);
    if (format === "png" && png_size) params.append("png_size", png_size.toString());

    const response = await axios.get<FreepikDownloadResponse>(
      `${this.baseUrl}/icons/${icon_id}/download?${params.toString()}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const downloadData = response.data.data;

    return {
      content: [
        {
          type: "text",
          text: `**Icon Download Ready**\n\n- **Filename**: ${downloadData.filename}\n- **Format**: ${format}\n- **Download URL**: ${downloadData.url}\n\n*Note: Download URL is temporary and should be used immediately.*`,
        },
      ],
    };
  }

  private async downloadResource(args: any) {
    const { resource_id, image_size = "original" } = args;

    const params = new URLSearchParams();
    if (image_size && image_size !== "original") {
      params.append("image_size", image_size);
    }

    const response = await axios.get<FreepikDownloadResponse>(
      `${this.baseUrl}/resources/${resource_id}/download?${params.toString()}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const downloadData = response.data.data;

    return {
      content: [
        {
          type: "text",
          text: `**Resource Download Ready**\n\n- **Filename**: ${downloadData.filename}\n- **Image Size**: ${image_size}\n- **Download URL**: ${downloadData.url}\n\n*Note: Download URL is temporary and should be used immediately.*`,
        },
      ],
    };
  }

  private async downloadResourceFormat(args: any) {
    const { resource_id, format } = args;

    const response = await axios.get<FreepikDownloadResponse>(
      `${this.baseUrl}/resources/${resource_id}/download/${format}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const downloadData = response.data.data;

    return {
      content: [
        {
          type: "text",
          text: `**Resource Download Ready**\n\n- **Filename**: ${downloadData.filename}\n- **Format**: ${format}\n- **Download URL**: ${downloadData.url}\n\n*Note: Download URL is temporary and should be used immediately.*`,
        },
      ],
    };
  }

  private async generateIcon(args: any) {
    const {
      prompt,
      webhook_url,
      format = "png",
      style,
      num_inference_steps,
      guidance_scale,
    } = args;

    const requestBody: FreepikIconGenerationRequest = {
      prompt,
      webhook_url,
    };

    if (format) requestBody.format = format;
    if (style) requestBody.style = style;
    if (num_inference_steps) requestBody.num_inference_steps = num_inference_steps;
    if (guidance_scale) requestBody.guidance_scale = guidance_scale;

    const response = await axios.post<FreepikIconGenerationResponse>(
      `${this.baseUrl}/ai/text-to-icon`,
      requestBody,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const taskData = response.data;

    return {
      content: [
        {
          type: "text",
          text: `**AI Icon Generation Started**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.task_status}\n- **Prompt**: ${prompt}\n- **Format**: ${format}\n- **Webhook URL**: ${webhook_url}\n\n*The generation is running. Results will be sent to your webhook URL when complete. Use the task ID to check status or download the icon.*`,
        },
      ],
    };
  }

  private async generateIconPreview(args: any) {
    const {
      prompt,
      webhook_url,
      style,
      num_inference_steps,
      guidance_scale,
    } = args;

    const requestBody: Partial<FreepikIconGenerationRequest> = {
      prompt,
      webhook_url,
    };

    if (style) requestBody.style = style;
    if (num_inference_steps) requestBody.num_inference_steps = num_inference_steps;
    if (guidance_scale) requestBody.guidance_scale = guidance_scale;

    const response = await axios.post<FreepikIconGenerationResponse>(
      `${this.baseUrl}/ai/text-to-icon/preview`,
      requestBody,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const taskData = response.data;

    return {
      content: [
        {
          type: "text",
          text: `**AI Icon Preview Generation Started**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.task_status}\n- **Prompt**: ${prompt}\n- **Webhook URL**: ${webhook_url}\n\n*Preview generation is running. Results will be sent to your webhook URL when complete.*`,
        },
      ],
    };
  }

  private async renderGeneratedIcon(args: any) {
    const { task_id, format = "png" } = args;

    const response = await axios.post<FreepikIconGenerationResponse>(
      `${this.baseUrl}/ai/text-to-icon/${task_id}/render/${format}`,
      {},
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const taskData = response.data;

    let statusText = `**Generated Icon Status**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.task_status}\n- **Format**: ${format}`;

    if (taskData.generated && taskData.generated.length > 0) {
      statusText += `\n\n**Generated Icons:**\n${taskData.generated
        .map((url, index) => `${index + 1}. ${url}`)
        .join("\n")}`;
    } else {
      statusText += `\n\n*Generation is still in progress. Check back later or wait for webhook notification.*`;
    }

    return {
      content: [
        {
          type: "text",
          text: statusText,
        },
      ],
    };
  }

  private async generateMystic(args: any) {
    const {
      prompt,
      webhook_url,
      structure_reference,
      style_reference,
      resolution,
      aspect_ratio,
      model,
    } = args;

    const requestBody: FreepikMysticRequest = { prompt };
    if (webhook_url) requestBody.webhook_url = webhook_url;
    if (structure_reference) requestBody.structure_reference = structure_reference;
    if (style_reference) requestBody.style_reference = style_reference;
    if (resolution) requestBody.resolution = resolution;
    if (aspect_ratio) requestBody.aspect_ratio = aspect_ratio;
    if (model) requestBody.model = model;

    const response = await axios.post<FreepikAITaskResponse>(
      `${this.baseUrl}/ai/mystic`,
      requestBody,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const taskData = response.data.data;

    return {
      content: [
        {
          type: "text",
          text: `**Mystic AI Generation Started**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.status}\n- **Prompt**: ${prompt}\n- **Model**: ${model || 'default'}\n- **Resolution**: ${resolution || 'default'}\n\n*Ultra-realistic, high-resolution image generation is running. Results will be available via webhook or task status check.*`,
        },
      ],
    };
  }

  private async getMysticTask(args: any) {
    const { task_id } = args;

    const response = await axios.get<FreepikAITaskResponse>(
      `${this.baseUrl}/ai/mystic/${task_id}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const taskData = response.data.data;
    let statusText = `**Mystic Task Status**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.status}`;

    if (taskData.has_nsfw !== undefined) {
      statusText += `\n- **NSFW Content**: ${taskData.has_nsfw ? 'Yes' : 'No'}`;
    }

    if (taskData.generated && taskData.generated.length > 0) {
      statusText += `\n\n**Generated Images:**\n${taskData.generated
        .map((url, index) => `${index + 1}. ${url}`)
        .join("\n")}`;
    } else if (taskData.status === "COMPLETED") {
      statusText += `\n\n*Task completed but no images were generated.*`;
    } else {
      statusText += `\n\n*Generation is still in progress.*`;
    }

    return {
      content: [
        {
          type: "text",
          text: statusText,
        },
      ],
    };
  }

  private async listMysticTasks(args: any) {
    const response = await axios.get<FreepikAITasksResponse>(
      `${this.baseUrl}/ai/mystic`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const tasks = response.data.data;
    const tasksList = tasks
      .map((task, index) => `${index + 1}. **${task.task_id}** - Status: ${task.status}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `**All Mystic Tasks**\n\n${tasksList || "*No tasks found.*"}`,
        },
      ],
    };
  }

  private async generateFluxDev(args: any) {
    const { prompt, webhook_url, aspect_ratio, styling, seed } = args;

    const requestBody: FreepikFluxDevRequest = { prompt };
    if (webhook_url) requestBody.webhook_url = webhook_url;
    if (aspect_ratio) requestBody.aspect_ratio = aspect_ratio;
    if (styling) requestBody.styling = styling;
    if (seed) requestBody.seed = seed;

    const response = await axios.post<FreepikAITaskResponse>(
      `${this.baseUrl}/ai/text-to-image/flux-dev`,
      requestBody,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const taskData = response.data.data;

    return {
      content: [
        {
          type: "text",
          text: `**Flux Dev Generation Started**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.status}\n- **Prompt**: ${prompt}\n- **Aspect Ratio**: ${aspect_ratio || 'square_1_1'}\n\n*AI image generation is running. Results will be available via webhook or task status check.*`,
        },
      ],
    };
  }

  private async getFluxDevTask(args: any) {
    const { task_id } = args;

    const response = await axios.get<FreepikAITaskResponse>(
      `${this.baseUrl}/ai/text-to-image/flux-dev/${task_id}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const taskData = response.data.data;
    let statusText = `**Flux Dev Task Status**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.status}`;

    if (taskData.generated && taskData.generated.length > 0) {
      statusText += `\n\n**Generated Images:**\n${taskData.generated
        .map((url, index) => `${index + 1}. ${url}`)
        .join("\n")}`;
    } else if (taskData.status === "COMPLETED") {
      statusText += `\n\n*Task completed but no images were generated.*`;
    } else {
      statusText += `\n\n*Generation is still in progress.*`;
    }

    return {
      content: [
        {
          type: "text",
          text: statusText,
        },
      ],
    };
  }

  private async listFluxDevTasks(args: any) {
    const response = await axios.get<FreepikAITasksResponse>(
      `${this.baseUrl}/ai/text-to-image/flux-dev`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const tasks = response.data.data;
    const tasksList = tasks
      .map((task, index) => `${index + 1}. **${task.task_id}** - Status: ${task.status}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `**All Flux Dev Tasks**\n\n${tasksList || "*No tasks found.*"}`,
        },
      ],
    };
  }

  private async reimagineFlux(args: any) {
    const { image, prompt, webhook_url, imagination, aspect_ratio } = args;

    const requestBody: FreepikReimagineFluxRequest = { image };
    if (prompt) requestBody.prompt = prompt;
    if (webhook_url) requestBody.webhook_url = webhook_url;
    if (imagination) requestBody.imagination = imagination;
    if (aspect_ratio) requestBody.aspect_ratio = aspect_ratio;

    const response = await axios.post<FreepikAITaskResponse>(
      `${this.baseUrl}/ai/beta/text-to-image/reimagine-flux`,
      requestBody,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const taskData = response.data.data;

    return {
      content: [
        {
          type: "text",
          text: `**Reimagine Flux Started**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.status}\n- **Imagination Level**: ${imagination || 'default'}\n- **Aspect Ratio**: ${aspect_ratio || 'original'}\n\n*Image reimagining is running. This is a Beta feature.*`,
        },
      ],
    };
  }

  private async upscaleImage(args: any) {
    const {
      image,
      webhook_url,
      scale_factor,
      optimized_for,
      prompt,
      creativity,
      hdr,
      resemblance,
      fractality,
      engine,
    } = args;

    const requestBody: FreepikImageUpscalerRequest = { image };
    if (webhook_url) requestBody.webhook_url = webhook_url;
    if (scale_factor) requestBody.scale_factor = scale_factor;
    if (optimized_for) requestBody.optimized_for = optimized_for;
    if (prompt) requestBody.prompt = prompt;
    if (creativity !== undefined) requestBody.creativity = creativity;
    if (hdr !== undefined) requestBody.hdr = hdr;
    if (resemblance !== undefined) requestBody.resemblance = resemblance;
    if (fractality !== undefined) requestBody.fractality = fractality;
    if (engine) requestBody.engine = engine;

    const response = await axios.post<FreepikAITaskResponse>(
      `${this.baseUrl}/ai/image-upscaler`,
      requestBody,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const taskData = response.data.data;

    return {
      content: [
        {
          type: "text",
          text: `**Image Upscaling Started**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.status}\n- **Scale Factor**: ${scale_factor || 'default'}\n- **Optimization**: ${optimized_for || 'standard'}\n\n*AI image upscaling is running. Results will be available via webhook or task status check.*`,
        },
      ],
    };
  }

  private async getUpscalerTask(args: any) {
    const { task_id } = args;

    const response = await axios.get<FreepikAITaskResponse>(
      `${this.baseUrl}/ai/image-upscaler/${task_id}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const taskData = response.data.data;
    let statusText = `**Upscaler Task Status**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.status}`;

    if (taskData.generated && taskData.generated.length > 0) {
      statusText += `\n\n**Upscaled Images:**\n${taskData.generated
        .map((url, index) => `${index + 1}. ${url}`)
        .join("\n")}`;
    } else if (taskData.status === "COMPLETED") {
      statusText += `\n\n*Task completed but no images were generated.*`;
    } else {
      statusText += `\n\n*Upscaling is still in progress.*`;
    }

    return {
      content: [
        {
          type: "text",
          text: statusText,
        },
      ],
    };
  }

  private async listUpscalerTasks(args: any) {
    const response = await axios.get<FreepikAITasksResponse>(
      `${this.baseUrl}/ai/image-upscaler`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const tasks = response.data.data;
    const tasksList = tasks
      .map((task, index) => `${index + 1}. **${task.task_id}** - Status: ${task.status}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `**All Upscaler Tasks**\n\n${tasksList || "*No tasks found.*"}`,
        },
      ],
    };
  }

  private async removeBackground(args: any) {
    const { image_url } = args;

    const response = await axios.post<FreepikRemoveBackgroundResponse>(
      `${this.baseUrl}/ai/beta/remove-background`,
      `image_url=${encodeURIComponent(image_url)}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const result = response.data;

    return {
      content: [
        {
          type: "text",
          text: `**Background Removed Successfully**\n\n- **Original**: ${result.original}\n- **High Resolution**: ${result.high_resolution}\n- **Preview**: ${result.preview}\n- **Download URL**: ${result.url}\n\n*Note: URLs are temporary and valid for only 5 minutes.*`,
        },
      ],
    };
  }

  private async expandImage(args: any) {
    const { image, prompt, left, right, top, bottom, webhook_url } = args;

    const requestBody: FreepikImageExpandRequest = { image };
    if (prompt) requestBody.prompt = prompt;
    if (left !== undefined) requestBody.left = left;
    if (right !== undefined) requestBody.right = right;
    if (top !== undefined) requestBody.top = top;
    if (bottom !== undefined) requestBody.bottom = bottom;
    if (webhook_url) requestBody.webhook_url = webhook_url;

    const response = await axios.post<FreepikAITaskResponse>(
      `${this.baseUrl}/ai/image-expand/flux-pro`,
      requestBody,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const taskData = response.data.data;

    return {
      content: [
        {
          type: "text",
          text: `**Image Expansion Started**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.status}\n- **Expansion**: Left:${left||0} Right:${right||0} Top:${top||0} Bottom:${bottom||0}\n\n*AI image expansion using Flux Pro is running.*`,
        },
      ],
    };
  }

  private async getExpandTask(args: any) {
    const { task_id } = args;

    const response = await axios.get<FreepikAITaskResponse>(
      `${this.baseUrl}/ai/image-expand/flux-pro/${task_id}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const taskData = response.data.data;
    let statusText = `**Expand Task Status**\n\n- **Task ID**: ${taskData.task_id}\n- **Status**: ${taskData.status}`;

    if (taskData.generated && taskData.generated.length > 0) {
      statusText += `\n\n**Expanded Images:**\n${taskData.generated
        .map((url, index) => `${index + 1}. ${url}`)
        .join("\n")}`;
    } else if (taskData.status === "COMPLETED") {
      statusText += `\n\n*Task completed but no images were generated.*`;
    } else {
      statusText += `\n\n*Expansion is still in progress.*`;
    }

    return {
      content: [
        {
          type: "text",
          text: statusText,
        },
      ],
    };
  }

  private async listExpandTasks(args: any) {
    const response = await axios.get<FreepikAITasksResponse>(
      `${this.baseUrl}/ai/image-expand/flux-pro`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const tasks = response.data.data;
    const tasksList = tasks
      .map((task, index) => `${index + 1}. **${task.task_id}** - Status: ${task.status}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `**All Expand Tasks**\n\n${tasksList || "*No tasks found.*"}`,
        },
      ],
    };
  }

  private async getResourceDetails(args: any) {
    const { resource_id } = args;

    const response = await axios.get<FreepikResource>(
      `${this.baseUrl}/resources/${resource_id}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const resource = response.data;

    return {
      content: [
        {
          type: "text",
          text: `**Resource Details**\n\n- **ID**: ${resource.id}\n- **Title**: ${resource.title}\n- **Author**: ${resource.author.username}\n- **License**: ${resource.license}\n- **Image URL**: ${resource.image.source.url}\n- **Resource URL**: ${resource.url}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    process.stderr.write("Freepik MCP server running on stdio\n");
  }
}

const server = new FreepikMCPServer();
server.run().catch((error) => {
  process.stderr.write(`Error: ${error}\n`);
  process.exit(1);
});