# distributed-transnoder

4°+5°+1° approccio (ibrido tra i precedenti)

To run in local:

 - add GCP's `keyfile.json` in root directory
 - check for env variables (Ex: default `PROJECT_ID` is `distributed-transoder`)

##### STANDALONE
__local development__
 - `cd standalone && yarn start`
 - visit `localhost:8080`

__deployment__
  - `cd standalone && gcloud app deploy`
  - visit `https://{PROJECT_ID}.appspot.com/`

##### DISTRIBUTED
__local development__
 - `cd coordinator && yarn start`
 - `cd worker && yarn start`
 - visit `localhost:8080`

__deployment__
 - `cd coordinator && gcloud app deploy coordinator.yaml`
 - `cd worker && gcloud app deploy worker.yaml`
 - visit `https://coordinator-dot-{PROJECT_ID}.appspot.com/`

 _PS: per testare `standalone` e `worker` in locale dovrebbe bastare avere `ffmpeg` installato, altrimenti si può runnare l'immagine docker (non l'ho provato così però)_
