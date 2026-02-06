#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "Pushing database schema..."
npx prisma db push

echo "Seeding database..."
npx tsx prisma/seed.ts

echo "Starting application..."
exec "$@"
