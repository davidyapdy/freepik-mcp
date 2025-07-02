# Freepik MCP Server

An MCP (Model Context Protocol) server that provides access to the Freepik API for searching and retrieving stock images, vectors, and PSD files.

## Features

- Search Freepik resources with advanced filters
- Get detailed information about specific resources
- Support for various content types (photos, vectors, PSDs)
- Filtering by orientation, color, people attributes, and more

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get your Freepik API key from the [Freepik Developer Dashboard](https://www.freepik.com/developers)

3. Set your API key as an environment variable:
   ```bash
   export FREEPIK_API_KEY=your_api_key_here
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Tools Available

### search_resources
Search for Freepik resources with various filters.

Parameters:
- `query` (optional): Search query
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 200)
- `orientation` (optional): "landscape", "portrait", "square", or "panoramic"
- `order` (optional): "relevance" or "recent"
- `license` (optional): "freemium" or "premium"
- `content_type` (optional): "photo", "vector", or "psd"
- `color` (optional): Hex color code without # (e.g., "ff0000")
- `people_age` (optional): Age group filter
- `people_gender` (optional): "male" or "female"
- `people_number` (optional): "none", "one", "two", or "group"
- `people_ethnicity` (optional): Ethnicity filter
- `ai_generated` (optional): Filter for AI-generated content

### search_icons
Search for Freepik icons with various filters.

Parameters:
- `term` (optional): Search term for icons
- `slug` (optional): Search by icon slug
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 20)
- `family_id` (optional): Specific icon family ID
- `order` (optional): "relevance" or "recent"
- `color` (optional): Color filter (e.g., "red", "blue", "multicolor")
- `shape` (optional): "outline" or "fill"
- `free_svg` (optional): Filter for free SVG icons

### download_icon
Download a Freepik icon in specified format and size.

Parameters:
- `icon_id` (required): Unique icon resource ID
- `format` (optional): Download format - "svg", "png", "gif", "mp4", "aep", "json", "psd", "eps" (default: "svg")
- `png_size` (optional): PNG size in pixels - 512, 256, 128, 64, 32, 24, 16 (default: 512, only applies to PNG format)

### download_resource
Download a Freepik resource (photo, vector, PSD) by ID.

Parameters:
- `resource_id` (required): Unique resource ID
- `image_size` (optional): Resize photo while maintaining aspect ratio - "small", "medium", "large", "original" (default: "original")

### download_resource_format
Download a Freepik resource in a specific format.

Parameters:
- `resource_id` (required): Unique resource ID
- `format` (required): Desired download format - "psd", "ai", "eps", "png", "jpg", "svg"

### generate_icon
Generate AI icons from text prompts using Freepik AI.

Parameters:
- `prompt` (required): Text description for icon generation
- `webhook_url` (required): URL to receive task results
- `format` (optional): Output format - "png", "svg" (default: "png")
- `style` (optional): Icon style - "solid", "outline", "color", "flat", "sticker"
- `num_inference_steps` (optional): Generation complexity (10-50)
- `guidance_scale` (optional): Generation precision (0-10)

### generate_icon_preview
Generate AI icon previews from text prompts.

Parameters:
- `prompt` (required): Text description for icon generation
- `webhook_url` (required): URL to receive task results
- `style` (optional): Icon style - "solid", "outline", "color", "flat", "sticker"
- `num_inference_steps` (optional): Generation complexity (10-50)
- `guidance_scale` (optional): Generation precision (0-10)

### render_generated_icon
Download generated AI icon in specified format.

Parameters:
- `task_id` (required): Unique identifier for the icon generation task
- `format` (required): Download format - "png", "svg"

### get_resource_details
Get detailed information about a specific resource.

Parameters:
- `resource_id` (required): The ID of the resource

## Claude Desktop Configuration

To use this MCP server with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "freepik": {
      "command": "npx",
      "args": [
        "-y",
        "freepik-mcp"
      ],
      "env": {
        "FREEPIK_API_KEY": "your_freepik_api_key_here"
      }
    }
  }
}
```

### Manual Installation

If you prefer to clone and run locally:

```json
{
  "mcpServers": {
    "freepik": {
      "command": "node",
      "args": ["path/to/freepik-mcp/dist/index.js"],
      "env": {
        "FREEPIK_API_KEY": "your_freepik_api_key_here"
      }
    }
  }
}
```

## Smithery Configuration

The `smithery.yaml` file is configured for Smithery. Update the `FREEPIK_API_KEY` environment variable with your actual API key.

## License

MIT