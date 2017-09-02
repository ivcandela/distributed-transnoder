FROM gcr.io/google_appengine/nodejs

RUN npm install --unsafe-perm --global yarn
COPY . /app/

RUN yarn install --production || \
  ((if [ -f yarn-error.log ]; then \
      cat yarn-error.log; \
    fi) && false)
CMD yarn start