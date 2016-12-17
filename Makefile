blud.js: src/*.ts
	tsc

clean:
	rm blud.js || true

all: blud.js

