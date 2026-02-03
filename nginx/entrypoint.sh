#!/bin/sh
set -e

DOMAIN="${DOMAIN:-kalender.jlssrv.de}"
EMAIL="${CERTBOT_EMAIL:-admin@jlssrv.de}"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

# Wenn Zertifikate noch nicht existieren: initiale Erstellung
if [ ! -f "$CERT_PATH" ]; then
    echo "Initiale Zertifikatserstellung für $DOMAIN..."
    # Nginx mit HTTP-Config starten (im Hintergrund)
    cp /etc/nginx/nginx-http.conf /etc/nginx/nginx.conf
    nginx -g "daemon on;"
    sleep 2

    # Certbot ausführen (Webroot-Methode)
    certbot certonly --webroot -w /var/www/certbot \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --force-renewal 2>/dev/null || true

    nginx -s quit 2>/dev/null || true
    sleep 1

    # HTTPS-Config mit Domain generieren
    if [ -f "$CERT_PATH" ]; then
        sed "s/\${DOMAIN}/$DOMAIN/g" /etc/nginx/nginx-https.conf.template > /etc/nginx/nginx.conf
        echo "Zertifikate erstellt. Starte Nginx mit HTTPS."
    else
        echo "WARNUNG: Zertifikatserstellung fehlgeschlagen. Starte mit HTTP-Config."
        cp /etc/nginx/nginx-http.conf /etc/nginx/nginx.conf
    fi
else
    # Zertifikate existieren: HTTPS-Config verwenden
    sed "s/\${DOMAIN}/$DOMAIN/g" /etc/nginx/nginx-https.conf.template > /etc/nginx/nginx.conf
fi

exec nginx -g "daemon off;"
