#!/bin/bash

# Health Check Script for Edo Talent Hunt Backend
# Usage: ./scripts/health-check.sh [URL]

URL=${1:-"http://localhost:3001"}

echo "🔍 Checking health of Edo Talent Hunt Backend at $URL"

# Check health endpoint
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "$URL/api/v1/health")
HTTP_CODE="${HEALTH_RESPONSE: -3}"
RESPONSE_BODY="${HEALTH_RESPONSE%???}"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Health check passed (HTTP $HTTP_CODE)"
    echo "📊 Response: $RESPONSE_BODY"
else
    echo "❌ Health check failed (HTTP $HTTP_CODE)"
    echo "📊 Response: $RESPONSE_BODY"
    exit 1
fi

# Check Swagger documentation
echo "📚 Checking API documentation..."
DOCS_RESPONSE=$(curl -s -w "%{http_code}" "$URL/api-docs/")
DOCS_HTTP_CODE="${DOCS_RESPONSE: -3}"

if [ "$DOCS_HTTP_CODE" -eq 200 ]; then
    echo "✅ API documentation is accessible"
else
    echo "⚠️ API documentation check failed (HTTP $DOCS_HTTP_CODE)"
fi

echo "🎉 Health check completed!"
echo "🌐 API Base URL: $URL/api/v1"
echo "📚 API Documentation: $URL/api-docs"
