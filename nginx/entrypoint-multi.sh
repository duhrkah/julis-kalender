#!/bin/sh
set -e

EMAIL="${CERTBOT_EMAIL:-admin@jlssrv.de}"
DOMAIN_PROD="kalender.jlssrv.de"
DOMAIN_TEST="kalender-test.jlssrv.de"
# Ein Zertifikat für beide Domains (SAN)
CERT_PATH="/etc/letsencrypt/live/${DOMAIN_PROD}/fullchain.pem"

if [ ! -f "$CERT_PATH" ]; then
    echo "Initiale Zertifikatserstellung für ${DOMAIN_PROD} und ${DOMAIN_TEST}..."
    cp /etc/nginx/nginx-multi-http.conf /etc/nginx/nginx.conf
    nginx -g "daemon on;"
    sleep 2

    certbot certonly --webroot -w /var/www/certbot \
        -d "$DOMAIN_PROD" \
        -d "$DOMAIN_TEST" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --force-renewal 2>/dev/null || true

    nginx -s quit 2>/dev/null || true
    sleep 1
fi

# HTTPS-Config verwenden
cp /etc/nginx/nginx-multi-https.conf.template /etc/nginx/nginx.conf

if [ ! -f "$CERT_PATH" ]; then
    echo "WARNUNG: Zertifikatserstellung fehlgeschlagen. Starte mit HTTP-Config."
    cp /etc/nginx/nginx-multi-http.conf /etc/nginx/nginx.conf
fi

exec nginx -g "daemon off;"
