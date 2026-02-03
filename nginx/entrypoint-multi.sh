#!/bin/sh
set -e

EMAIL="${CERTBOT_EMAIL:-admin@jlssrv.de}"
DOMAIN_PROD="kalender.jlssrv.de"
DOMAIN_TEST="kalender-test.jlssrv.de"
CERT_PROD="/etc/letsencrypt/live/${DOMAIN_PROD}/fullchain.pem"
CERT_TEST="/etc/letsencrypt/live/${DOMAIN_TEST}/fullchain.pem"

if [ ! -f "$CERT_PROD" ] || [ ! -f "$CERT_TEST" ]; then
    echo "Initiale Zertifikatserstellung für ${DOMAIN_PROD} und ${DOMAIN_TEST}..."
    cp /etc/nginx/nginx-multi-http.conf /etc/nginx/nginx.conf
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

# HTTPS-Config: Vollversion nur wenn beide Zertifikate existieren
if [ -f "$CERT_PROD" ] && [ -f "$CERT_TEST" ]; then
    cp /etc/nginx/nginx-multi-https.conf.template /etc/nginx/nginx.conf
elif [ -f "$CERT_PROD" ]; then
    cp /etc/nginx/nginx-multi-https-prod-only.conf.template /etc/nginx/nginx.conf
    echo "Hinweis: Test-Zertifikat fehlt noch – kalender-test.jlssrv.de erst nach nächstem Deploy mit HTTPS."
elif [ -f "$CERT_TEST" ]; then
    echo "WARNUNG: Nur Test-Zertifikat vorhanden. Starte mit HTTP-Config."
    cp /etc/nginx/nginx-multi-http.conf /etc/nginx/nginx.conf
else
    echo "WARNUNG: Keine Zertifikate vorhanden. Starte mit HTTP-Config."
    cp /etc/nginx/nginx-multi-http.conf /etc/nginx/nginx.conf
fi

exec nginx -g "daemon off;"
