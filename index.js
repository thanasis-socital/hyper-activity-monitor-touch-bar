const { TouchBar } = require('electron')
const {TouchBarButton, TouchBarSpacer} = TouchBar
const path = require('path')
const { fork } = require('child_process');

const child = fork(path.join(__dirname, 'child.js'));
process.on('exit', () => { child.kill() })

let currentUid, currentWindow;

exports.onApp = app => {
  app.on('browser-window-focus', (event, win) => {
    currentWindow = win;
  });
};

exports.onWindow = win => {
  win.rpc.on('uid set', uid => { currentUid = uid });
  currentWindow = win
  populateTouchBar();
};

const LOAD_NORMAL = "#2ecc71";
const LOAD_MEDIUM = "#f1c40f";
const LOAD_HIGH = "#d35400";
const LOAD_SEVERE = "#e74c3c";

const cpu = new TouchBarButton({
  label: '-%',
  backgroundColor: "#bdc3c7",
  icon: path.join(__dirname, 'icons/chip.png'),
  iconPosition: "left"
})
const memory = new TouchBarButton({
  label: '-',
  backgroundColor: "#bdc3c7",
  icon: path.join(__dirname, 'icons/ram.png'),
  iconPosition: "left"
})
const network = new TouchBarButton({
  label: '-',
  backgroundColor: '#3498db',
  icon: path.join(__dirname, 'icons/internet.png'),
  iconPosition: "left"
})
const battery = new TouchBarButton({
  label: '-',
  backgroundColor: "#bdc3c7",
  icon: path.join(__dirname, 'icons/power.png'),
  iconPosition: "left"
})
const disk = new TouchBarButton({
  label: '-',
  backgroundColor: "#9b59b6",
  icon: path.join(__dirname, 'icons/hard-disk-drive.png'),
  iconPosition: "left"
})

const handleLoad = (data) => {
  if (typeof data !== 'undefined' && data.currentLoad !== undefined){
    let load = data.currentLoad
    cpu.label = `${load.toFixed(0)}%`
    if (load <= 20) cpu.backgroundColor = LOAD_NORMAL;
    else if (load > 20 && load <= 40) cpu.backgroundColor = LOAD_MEDIUM;
    else if (load > 40 && load <= 80) cpu.backgroundColor = LOAD_HIGH;
    else if (load > 80 && load <= 100) cpu.backgroundColor = LOAD_SEVERE;
  }
}
const handleMem = (data) => {
  if (typeof data !== 'undefined' && data){
    load = ((100* data.active ) / data.total).toFixed(0)
    memory.label = load+"%"
    if (load <= 20) memory.backgroundColor = LOAD_NORMAL;
    else if (load > 20 && load <= 40) memory.backgroundColor = LOAD_MEDIUM;
    else if (load > 40 && load <= 80) memory.backgroundColor = LOAD_HIGH;
    else if (load > 80 && load <= 100) memory.backgroundColor = LOAD_SEVERE;
  }
}
const handleNet = (data) => {
  if (typeof data !== 'undefined' && data){
    kbtx = (data[0].tx_sec * 0.001).toFixed(0)
    kbrx = (data[0].rx_sec * 0.001).toFixed(0)
    l = (kbtx+kbrx).toString().length

    network.label = "⇡"+ (kbtx*0.001).toFixed(2) +" ⇣"+ (kbrx*0.001).toFixed(2) +" MB/s"
  }
}
const handleBattery = (data) => {
  if (typeof data !== 'undefined' && data){
    if (data.ischarging){
      battery.icon = path.join(__dirname, 'icons/charger.png')
    }else{
      battery.icon = path.join(__dirname, 'icons/power.png')
    }
    load = data.percent ? data.percent.toFixed(0) : 0
    battery.label = load+"%"
    if (load <= 20) battery.backgroundColor = LOAD_SEVERE;
    else if (load > 20 && load <= 40) battery.backgroundColor = LOAD_HIGH;
    else if (load > 40 && load <= 80) battery.backgroundColor = LOAD_MEDIUM;
    else if (load > 80 && load <= 100) battery.backgroundColor = LOAD_NORMAL
  }
}
const handleDisk = (data) => {
  if (typeof data !== 'undefined' && data){
    load = data.tIO_sec ? data.tIO_sec.toFixed(0) : 0
    more = 4-load.toString().length
    tomore=""
    for(i=0;i<more;i++) {
      tomore+="0"
    }
    disk.label = tomore+load+"/s"

  }
}

const handlers = {
  currentLoad: handleLoad,
  mem: handleMem,
  battery: handleBattery,
  disksIO: handleDisk,
  networkStats: handleNet,
}

function populateTouchBar() {
  const touchBar = new TouchBar({
    items: [cpu,
      new TouchBarSpacer({size: 'small'}),
      memory,
      new TouchBarSpacer({size: 'small'}),
      network,
      new TouchBarSpacer({size: 'small'}),
      disk,
      new TouchBarSpacer({size: 'small'}),
      battery,]
  });
  currentWindow.setTouchBar(touchBar);
}

child.on('message', (m) => {
  const {indicator, data} = JSON.parse(m)
  handlers[indicator](data)
});
