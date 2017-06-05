# docker-ffmpeg

A dockerized ffmpeg built for processing audio for the ilm-server project.

## Usage

In your code, call ffmpeg(folderPath, taskName, ...(args))

This will:
* build the image if it does not yet exist on the server
* start a new docker instance
* mount folderPath as /audio in the docker image
* run /app/[taskName].sh (args)...

## Tasks

Each task is written as a separate bash script which is run inside the docker 
container. The bash scripts must be named as [taskName].sh, where [taskName] is 
the expected parameter to be used when calling ffmpeg within node.

Between import and export, all audio files should be in .flac format.

AF: Audio File for an entire audiobook
BLAF: Block Level Audio File for a single section

- import: converts disparate audio files to .flac and joins into AF
- combineAll: joins BLAFs into AF, e.g. to prepare for mastering
- insert: inserts an audio selection into a BLAF
- delete: deletes an audio selection from a BLAF
- replace: replaces an audio selection from a BLAF
- splitBlock: splits a BLAF into two
- joinBlocks: joins two BLAFs into one
- export: convert to .ogg or .mp3 (TODO: choose) for publishing

## Extending

New capabilities of ffmpeg docker container should be added as bash scripts in 
the scripts folder. It is the responsibility of the node.js calling code to know 
what parameters are needed by each script.

## Security

It is the responsibility of the node.js calling code to ensure that the folder 
passed to ffmpeg is one that contains only audio to be processed. **Security 
vulnerabilities could be introduced if system folders are mounted inside the 
ffmpeg docker container.**

It is the responsibility of bash scripts not to introduce security 
vulnerabilities through incorrect handling of malicious parameters. This 
responsibility should be largely mitigated by the containerized nature of the 
service, in that data outside the mounted folder should be inaccessible from 
within the ffmpeg docker container.