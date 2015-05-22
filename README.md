# slack-killer

Simple sample application that uses data channels to create a simple slack-like application.

## Usage

```
npm install
npm start
```

Then visit http://localhost:8080

## Mobile app

To use the Cordova app

```
cd mobileclient
cordova plugin add com.eface2face.iosrtc
cordova platform add ios
cordova prepare ios
cordova build
cordova emulate ios
```