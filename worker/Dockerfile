FROM gcr.io/google_appengine/nodejs

RUN echo "deb http://www.deb-multimedia.org jessie main non-free" >> /etc/apt/sources.list
RUN echo "deb-src http://www.deb-multimedia.org jessie main non-free" >> /etc/apt/sources.list
RUN apt-get --allow-unauthenticated -y update
RUN apt-get --allow-unauthenticated -y install deb-multimedia-keyring
RUN apt-get --allow-unauthenticated -y update
RUN apt-get --allow-unauthenticated -y install libav-tools ffmpeg

RUN npm install --unsafe-perm --global yarn
COPY . /app/

RUN yarn install --production || \
  ((if [ -f yarn-error.log ]; then \
      cat yarn-error.log; \
    fi) && false)
CMD yarn start