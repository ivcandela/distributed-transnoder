# distributed-transnoder

4° approccio (ibrido tra i precedenti)

To run in local:

 - add GCP's `keyfile.json` in root directory
 - check for env variables (Ex: default `PROJECT_ID` is `distributed-transoder`)
 - `cd coordinator && yarn start`
 - `cd worker && yarn start`
 - visit `localhost:8080`

 _PS: per testare `worker` in locale dovrebbe bastare avere `ffmpeg` installato, altrimenti si può runnare l'immagine docker (non l'ho provato così però)_
