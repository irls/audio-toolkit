FROM jrottenberg/ffmpeg:3.4-alpine

MAINTAINER Daniel Jones <dan@firm-foundation.org>

RUN apk add --no-cache bash

ADD ./scripts /app

WORKDIR /app

ENTRYPOINT ["bash"]