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
- `orientation` (optional): "landscape", "portrait", or "square"
- `content_type` (optional): "photo", "vector", or "psd"
- `color` (optional): Hex color code without # (e.g., "ff0000")
- `people_age` (optional): Age group filter
- `people_gender` (optional): "male" or "female"

### get_resource_details
Get detailed information about a specific resource.

Parameters:
- `resource_id` (required): The ID of the resource

## Smithery Configuration

The `mcp.json` file is configured for Smithery. Update the `FREEPIK_API_KEY` environment variable with your actual API key.

## License

MIT