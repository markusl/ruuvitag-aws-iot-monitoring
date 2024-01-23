npx ts-node test \
  --topic_prefix=RuuviTag \
  --private_key=../keys/RaspberryPi.private.key \
  --client_certificate=../keys/RaspberryPi.cert.pem \
  --ca_file=../keys/AmazonRootCA1.pem \
  --endpoint=a212cfb7mz9p00-ats.iot.eu-west-1.amazonaws.com \
  --client_id=RaspberryPi
