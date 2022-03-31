FROM jrottenberg/ffmpeg:4.3-alpine

MAINTAINER Daniel Jones <dan@firm-foundation.org>

RUN apk add --no-cache bash

ADD ./scripts /app

WORKDIR /app

ENTRYPOINT ["bash"]