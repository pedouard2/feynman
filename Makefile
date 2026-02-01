.PHONY: help dev dev-real seed db-init test reset

help:
	@echo "Available commands:"
	@echo "  make dev       - Start development environment with mocks enabled"
	@echo "  make dev-real  - Start development environment with real APIs"
	@echo "  make seed      - Seed database with default personas"
	@echo "  make db-init   - Initialize database (run seed manually)"
	@echo "  make test      - Run tests with test database"
	@echo "  make reset     - Reset everything (stop containers, clean volumes, restart)"

dev:
	@echo "Starting development environment with mocks..."
	docker compose up -d
	@echo "Waiting for database..."
	@sleep 3
	@echo "Checking if database needs initialization..."
	@if ! docker exec $$(docker compose ps -q db) psql -U postgres -d feynman -c "SELECT 1 FROM conversations LIMIT 1" 2>/dev/null; then \
		echo "Database not initialized, running seed..."; \
		docker exec -i $$(docker compose ps -q db) psql -U postgres -d feynman < apps/web/scripts/seed.sql; \
		echo "Database seeded successfully!"; \
	else \
		echo "Database already initialized."; \
	fi
	cd apps/web && npm run dev:mock

dev-real:
	@echo "Starting development environment with real APIs..."
	docker compose up -d
	@echo "Waiting for database..."
	@sleep 3
	@echo "Checking if database needs initialization..."
	@if ! docker exec $$(docker compose ps -q db) psql -U postgres -d feynman -c "SELECT 1 FROM conversations LIMIT 1" 2>/dev/null; then \
		echo "Database not initialized, running seed..."; \
		docker exec -i $$(docker compose ps -q db) psql -U postgres -d feynman < apps/web/scripts/seed.sql; \
		echo "Database seeded successfully!"; \
	else \
		echo "Database already initialized."; \
	fi
	cd apps/web && npm run dev

seed:
	@echo "Seeding database..."
	docker exec -i $$(docker compose ps -q db) psql -U postgres -d feynman < apps/web/scripts/seed.sql
	@echo "Database seeded successfully!"

db-init:
	@echo "Initializing database..."
	docker exec -i $$(docker compose ps -q db) psql -U postgres -d feynman < apps/web/scripts/seed.sql
	@echo "Database initialized successfully!"

test:
	@echo "Starting test database..."
	docker compose -f docker-compose.test.yml up -d
	@echo "Waiting for test database..."
	@sleep 3
	@echo "Running tests..."
	cd apps/web && npm test
	@echo "Stopping test database..."
	docker compose -f docker-compose.test.yml down

reset:
	@echo "Stopping all containers..."
	docker compose down -v
	docker compose -f docker-compose.test.yml down -v 2>/dev/null || true
	@echo "Starting fresh database..."
	docker compose up -d
	@sleep 3
	@echo "Seeding database..."
	docker exec -i $$(docker compose ps -q db) psql -U postgres -d feynman < apps/web/scripts/seed.sql
	@echo "Reset complete!"
