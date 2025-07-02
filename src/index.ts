#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

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
    pagination: {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  };
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
                enum: ["landscape", "portrait", "square"],
                description: "Image orientation filter",
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
      content_type,
      color,
      people_age,
      people_gender,
    } = args;

    const params = new URLSearchParams();
    if (query) params.append("q", query);
    params.append("page", page.toString());
    params.append("limit", Math.min(limit, 200).toString());
    if (orientation) params.append("orientation", orientation);
    if (content_type) params.append("content_type", content_type);
    if (color) params.append("color", color);
    if (people_age) params.append("people_age", people_age);
    if (people_gender) params.append("people_gender", people_gender);

    const response = await axios.get<FreepikResponse>(
      `${this.baseUrl}/resources?${params.toString()}`,
      {
        headers: {
          "x-freepik-api-key": this.apiKey,
        },
      }
    );

    const resources = response.data.data.map((resource) => ({
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
          text: `Found ${response.data.meta.pagination.total} resources (showing page ${page} of ${response.data.meta.pagination.total_pages}):\n\n${resources
            .map(
              (r) =>
                `**${r.title}**\n- ID: ${r.id}\n- Author: ${r.author}\n- License: ${r.license}\n- Image: ${r.image_url}\n- URL: ${r.url}`
            )
            .join("\n\n")}`,
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
    console.error("Freepik MCP server running on stdio");
  }
}

const server = new FreepikMCPServer();
server.run().catch(console.error);