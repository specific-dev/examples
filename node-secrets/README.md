# Secrets Example

A simple example demonstrating how to use secrets and configs in Specific

## Definitions

This example defines:

- `my_secret` - A secret value (encrypted, not visible in logs)
- `my_config` - A config value (visible in logs and UI)

## Usage

1. Set the secret and config values:
   ```bash
   specific secrets set my_secret "super-secret-value"
   specific config set my_config "my-config-value"
   ```

2. Run the development server:
   ```bash
   specific dev
   ```

3. The server will respond with:
   ```json
   {
     "my_secret": "super-secret-value",
     "my_config": "my-config-value"
   }
   ```

## Secrets vs Configs

- **Secrets**: Encrypted at rest, masked in logs, use for API keys, passwords, tokens
- **Configs**: Visible in logs and UI, use for non-sensitive configuration values
