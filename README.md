# Silo Telegram Bot

A Telegram bot designed to monitor the health factor of a Silo account and send notifications when the health factor falls below a user-defined threshold. The bot offers various flows for users to interact, manage, and configure notifications effectively.

## Commands Overview

Here’s a summary of the main commands that users can use with the bot:

/start: Start the bot and see available options.
/watch: Add a new position to track based on a Silo account.
/manage: Manage your active subscriptions.
/help: Access help information for bot usage.
/example: View an example of the notification the bot sends when a health factor alert is triggered.

## Commands Details

### 1. Start Flow (/start)

- Sends a welcome message with an overview of the bot's available commands.
- Provides basic instructions on how to get started using the bot.

### 2. Watch Flow (/watch)

- Prompts users to enter an account address to monitor.
- Displays the available positions for the entered address.
- Allows users to select a position to track.
- Requests a health factor threshold from the user to trigger notifications.
- Lets the user choose a chat (private or group) for receiving health factor notifications.
- Confirms successful subscription creation.

### 3. Manage Flow (/manage)

- Lists all of the user's active subscriptions.
- Allows the user to select and manage individual subscriptions, with the following options:
  - Pause/Resume the subscription.
  - Unsubscribe from the subscription.
  - Change settings, such as:
    - Health factor notification threshold.
    - Preferred language.
    - Notification interval.
- Provides global management actions:
  - Pause all subscriptions.
  - Restart all subscriptions.
  - Unsubscribe from all subscriptions.

### 4. Help Flow (/help)

- Displays general help and usage information.
- Provides detailed help for specific commands upon request.

### 5. Example Flow (/example)

- Sends an example notification message to show users what to expect.

### 6. Notification System

- Sends alerts when the health factor of a tracked position falls below the user-defined threshold.
- Notifications include options to:
  - View position details.
  - Add collateral.
  - Repay debt.
  - Manage subscription settings.

### 7. Rate Limit Notifications

- Configurable cooldown period between notifications to prevent spamming in case of rapid health factor drops.

### 8. Delivery of Notifications

- Users can configure which chat (individual or group) will receive the notifications, enhancing usability for both personal and team scenarios.

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/bleu/silo-hf-monitor.git
   ```
2. Navigate to the project directory:
   ```sh
   cd silo-hf-monitor
   ```
3. Install dependencies (we use pnpm as the package manager):
   ```sh
   pnpm install
   ```

## Configuration

1. Export environment variables, e.g:
   ```sh
    export DATABASE_PRIVATE_URL=postgres://postgres:postgres@localhost:5432
    export TELEGRAM_BOT_TOKEN=...
    export TELEGRAM_WEBHOOK_URL=...
    export PONDER_RPC_URL_MAINNET=...
    export PONDER_RPC_URL_OPTIMISM=...
    export PONDER_RPC_URL_ARBITRUM=...
    export PONDER_RPC_URL_BASE=...
   ```

## Running the Project

### 1. Set Up the Database with Docker

The project uses PostgreSQL as the database, which you can run via Docker. Use the provided `docker-compose.yml` file to set up the PostgreSQL service:

Start Docker Compose:

```sh
docker-compose up -d
```

This will start a PostgreSQL container with the name `silo-hc-monitor-postgres`. The database will be accessible at `localhost:5432` with the credentials defined in the compose file.

Ensure the database is running correctly by checking the container status:

```sh
docker ps
```

The database is now ready to store the subscriptions and health factor monitoring data.

### 2. Run Development Scripts

The project has several services to run concurrently during development: the notifier, indexer, bot, and the Ponder process. You can use the predefined `pnpm` scripts for these tasks.

#### Running All Services Concurrently

To run all services (Ponder, Bot, Notifier, and Indexer) simultaneously during development, use the `dev:all` script:

```sh
pnpm dev:all
```

This uses `concurrently` to run all the services in parallel, allowing you to work on multiple components of the project seamlessly.

#### Running Individual Services

Ponder: `pnpm dev`
Telegram Bot: `pnpm dev:bot`
Indexer: `pnpm dev:indexer`
Notifier: `pnpm dev:notifier`.

### 3. Migrations

For any database schema updates, you can run migrations for the bot service as follows:

```sh
pnpm migrate:bot
```

### 5. Linting and Type Checking

To ensure the code follows standard conventions and is free from type errors, you can run:

#### Linting:

```sh
pnpm lint
```

#### Type Checking:

```sh
pnpm typecheck
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
