all: setup run

setup:
		cd server && npm install &&\
			cd ../client && npm install &&\
			webpack

run:
		cd server && npm run serve
