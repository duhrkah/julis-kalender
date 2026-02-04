#!/bin/sh
set -e

EMAIL="${CERTBOT_EMAIL:-admin@jlssrv.de}"
DOMAIN_PROD="kalender.jlssrv.de"
DOMAIN_TEST="kalender-test.jlssrv.de"
DOMAIN_BUVO="kalender-buvo.jlssrv.de"
CERT_PROD="/etc/letsencrypt/live/${DOMAIN_PROD}/fullchain.pem"
CERT_TEST="/etc/letsencrypt/live/${DOMAIN_TEST}/fullchain.pem"
CERT_BUVO="/etc/letsencrypt/live/${DOMAIN_BUVO}/fullchain.pem"

# Initiale Zertifikatserstellung für Prod und Test
if [ ! -f "$CERT_PROD" ] || [ ! -f "$CERT_TEST" ]; then
    echo "Initiale Zertifikatserstellung für ${DOMAIN_PROD} und ${DOMAIN_TEST}..."
    cp /etc/nginx/nginx-multi-bootstrap.conf /etc/nginx/nginx.conf
    nginx -g "daemon on;"
    sleep 2

    [ ! -f "$CERT_PROD" ] && certbot certonly --webroot -w /var/www/certbot \
        -d "$DOMAIN_PROD" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --force-renewal 2>/dev/null || true

    [ ! -f "$CERT_TEST" ] && certbot certonly --webroot -w /var/www/certbot \
        -d "$DOMAIN_TEST" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --force-renewal 2>/dev/null || true

    nginx -s quit 2>/dev/null || true
    sleep 1
fi

# Wähle nginx-Konfiguration basierend auf vorhandenen Zertifikaten
if [ -f "$CERT_PROD" ] && [ -f "$CERT_TEST" ] && [ -f "$CERT_BUVO" ]; then
    echo "Alle Zertifikate vorhanden (Prod + Test + BuVo). Starte mit vollständiger HTTPS-Config."
    cp /etc/nginx/nginx-multi-https.conf.template /etc/nginx/nginx.conf
elif [ -f "$CERT_PROD" ] && [ -f "$CERT_TEST" ]; then
    echo "Prod + Test Zertifikate vorhanden. BuVo nur über HTTP."
    echo "Hinweis: BuVo-Zertifikat erstellen mit:"
    echo "  docker compose -p kalender-proxy -f docker-compose.proxy.yml --profile renew run --rm certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN_BUVO} --email ${EMAIL} --agree-tos --no-eff-email"
    cp /etc/nginx/nginx-multi-https-base.conf.template /etc/nginx/nginx.conf
elif [ -f "$CERT_PROD" ]; then
    echo "Nur Prod-Zertifikat vorhanden."
    cp /etc/nginx/nginx-multi-https-prod-only.conf.template /etc/nginx/nginx.conf
else
    echo "WARNUNG: Keine Zertifikate vorhanden. Starte mit HTTP-Config."
    cp /etc/nginx/nginx-multi-http.conf /etc/nginx/nginx.conf
fi

exec nginx -g "daemon off;"
