# File Storage Example

A simple file upload and download application using object storage (Tigris/S3-compatible).

## Features

- Upload files via web interface
- List files in a private collection identified by a 24-hour browser cookie
- Download files
- Delete files in your collection. A daily cron removes visitor uploads older than 24 hours.

## Configuration

The `specific.hcl` defines an object store database:

```hcl
database "files" {
  engine = "object_store"
}
```

The service receives these environment variables:
- `S3_ENDPOINT` - The S3-compatible endpoint
- `S3_ACCESS_KEY` - Access key for authentication
- `S3_SECRET_KEY` - Secret key for authentication
- `S3_BUCKET` - The bucket name

## Running locally

```bash
specific dev
```

Then open http://localhost:3000 in your browser.

## Deploying

```bash
specific deploy
```

The platform will automatically:
1. Create a Tigris bucket
2. Generate scoped IAM credentials for the bucket
3. Inject the credentials as environment variables
