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

# Dynamische nginx-Konfiguration basierend auf vorhandenen Zertifikaten
generate_nginx_config() {
    # Base config kopieren (ohne BuVo HTTPS Block)
    if [ -f "$CERT_PROD" ] && [ -f "$CERT_TEST" ]; then
        cp /etc/nginx/nginx-multi-https-base.conf.template /etc/nginx/nginx.conf
    elif [ -f "$CERT_PROD" ]; then
        cp /etc/nginx/nginx-multi-https-prod-only.conf.template /etc/nginx/nginx.conf
        echo "Hinweis: Test-Zertifikat fehlt noch."
        return
    else
        echo "WARNUNG: Keine Zertifikate vorhanden. Starte mit HTTP-Config."
        cp /etc/nginx/nginx-multi-http.conf /etc/nginx/nginx.conf
        return
    fi

    # BuVo HTTPS Block hinzufügen, falls Zertifikat existiert
    if [ -f "$CERT_BUVO" ]; then
        echo "BuVo-Zertifikat gefunden, füge HTTPS-Block hinzu..."
        # Vor dem schließenden "}" den BuVo-Block einfügen
        sed -i '/^}$/d' /etc/nginx/nginx.conf
        cat >> /etc/nginx/nginx.conf << 'BUVO_BLOCK'

    # HTTPS - Bundesverband (kalender-buvo.jlssrv.de)
    server {
        listen 443 ssl http2;
        server_name kalender-buvo.jlssrv.de;

        ssl_certificate /etc/letsencrypt/live/kalender-buvo.jlssrv.de/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/kalender-buvo.jlssrv.de/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location /api/ {
            proxy_pass http://buvo-backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location / {
            proxy_pass http://buvo-frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
BUVO_BLOCK
    else
        echo "Hinweis: BuVo-Zertifikat fehlt noch - kalender-buvo.jlssrv.de nur über HTTP erreichbar."
        echo "         Erstelle Zertifikat mit: docker compose -p kalender-proxy -f docker-compose.proxy.yml --profile renew run --rm certbot certonly --webroot -w /var/www/certbot -d kalender-buvo.jlssrv.de --email ${EMAIL} --agree-tos --no-eff-email"
    fi
}

generate_nginx_config

exec nginx -g "daemon off;"
