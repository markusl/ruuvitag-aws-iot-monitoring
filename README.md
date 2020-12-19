# Building a RuuviTag weather monitoring dashboard using AWS IOT

![Dependency Graph](ruuvitag.drawio.png)

## Setup

### 1. RuuviTag

Just unbox the Ruuvitag and verify the functionality with RuuviStation mobile application.

### 2. Raspberry Pi Zero W

Check out the headless setup instructions <https://www.raspberrypi.org/documentation/configuration/wireless/headless.md>.

### 3. Setup this repository to Raspberry Pi device

1. `git clone https://github.com/markusl/ruuvitag-aws-iot-monitoring.git`
2. Install the prerequisites:

```sh
sudo apt-get install libudev-dev libusb-1.0-0-dev
npm install
```

### 4. Configure AWS IoT device

Open `awsiot/bin/awsiot.ts` and configure the relevant RuuviTag id's for AWS IoT event rules.

Then deploy the AWS IoT cloud infrastructure:

```sh
cd awsiot/
npm i -g aws-cdk
npm install
cdk deploy
```

### 5. Configure and run the application

1. Go to AWS Secrets Manager in AWS Console and look for `RaspberryPiZeroW-Credentials`.
2. Use the Retrieve Secret Value button to get `certificatePem`, `privateKey` and `publicKey`.
3. Configure proper keys under `keys`.
4. Update proper endpoint and client id in `start-monitoring.sh`

Run the application:

```sh
sudo apt-get install screen
screen app/start-monitoring.sh
```
