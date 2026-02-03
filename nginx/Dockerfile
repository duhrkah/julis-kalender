FROM nginx:alpine

# Certbot für Let's Encrypt
RUN apk add --no-cache certbot

# Configs kopieren
COPY nginx-http.conf /etc/nginx/nginx-http.conf
COPY nginx-https.conf.template /etc/nginx/nginx-https.conf.template
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && \
    mkdir -p /var/www/certbot

ENTRYPOINT ["/entrypoint.sh"]
