#!/bin/bash
cd server && npm install &
serverBuild=$!
cd client && npm install &
clientBuild=$!
wait ${clientBuild}
cd client && npm run webpack &
webpackBuild=$!
wait ${serverBuild} ${clientBuild} ${webpackBuild}
