import {
  GPS
} from './GPS2AMAP.js'
let callback = null // promise 的 resolve会赋值给这个函数
const onSuccess = (position) => {
  const {
    latitude: lat,
    longitude: lng
  } = position.coords
  const exchange = GPS.gcj_encrypt(Number.parseFloat(lat), Number.parseFloat(lng)) // 对精度要求不高可以省略这步，把上面获取到的经纬度直接传给saveLocation
  console.log('gps定位', `${exchange.lat}-${exchange.lng}`)
  saveLocation(exchange.lat, exchange.lng)
}
const onError = () => {
  initAMAP()
  console.error('gps失败')
}

const initAMAP = () => {
  const key = '80087a0431514fc08f05b6fabad3c8d5', 
        MP = new Promise(function (resolve, reject) {
          window.init = function () {
            resolve(AMap)
          };
          let script = document.createElement("script");
          script.type = "text/javascript";
          script.src = "//webapi.amap.com/maps?v=1.4.6&key="+key+"&callback=init";
          script.onerror = reject;
          document.head.appendChild(script);
        })
  MP.then(function (AMap) {
    startAMAPLocation(AMap)
  }).catch(err=>{
    console.error(JSON.stringify(err));
  })
}

// 开始高德定位
const startAMAPLocation = (AMap) => {
  AMap.plugin('AMap.Geolocation', function () {
    var geolocation = new AMap.Geolocation({
      enableHighAccuracy: true, //是否使用高精度定位，默认:true
      timeout: 5000, //超过10秒后停止定位，默认：5s
      buttonPosition: 'RB', //定位按钮的停靠位置
      buttonOffset: new AMap.Pixel(10, 20), //定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
      zoomToAccuracy: true, //定位成功后是否自动调整地图视野到定位点
    });
    // map.addControl(geolocation);
    geolocation.getCurrentPosition(function (status, result) {
      if (status == 'complete') {
        console.log('高德: ', `${result.position.lat},${result.position.lng}`)
        saveLocation(result.position.lat, result.position.lng)
      } else {
        console.error('高德失败')
        saveLocation(0, 0)
      }
    });
  });
}
// 处理获取到的经纬度
const saveLocation = (lat = 0, lng = 0) => {
  lat && (lat = parseFloat(lat).toFixed(6))
  lng && (lng = parseFloat(lng).toFixed(6))
  typeof callback === 'function' && callback({lat, lng})
}

// promise, resolve的第一个参数就是经纬度，
const startLocation = new Promise((resolve, reject) => {
  callback = resolve
  const options = {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 5000
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
  } else {
    saveLocation(0, 0)
    console.error('您的浏览器不支持地理位置定位')
  }
})

startLocation.then(({lat, lng}) => {
    if (lat == 0 ||　lng == 0){
        document.getElementById("info").innerHTML = "GPS error";
    }
    else {
	    $.ajax({
            url:'http://ztmanage.allcitygo.com:8096/station/detail_list',
            data:{
                "lng":lng,
			    "lat":lat,
                "limit_distance":"500",
			    "city_code":"610300"
            },
		    type: "get",
            success:function(datas){
                var data = JSON.stringify(datas);
			    data = JSON.parse(data);
	            if (data["message"] === 'Success'){
		            data = data["data"];
		            var len = data.length, i, j, station, linelen, lineNa, lineNo, lineCo, buslink, innerH; 
		            innerH = "";
		            for (i = 0; i < len; i ++){			
		    	        station = data[i]["name"];
			            innerH += "<div data-info class=\"line-list\"><div data-info class=\"stationNa\">&nbsp;&nbsp;"+ station +"</div>";
			            linelen = data[i]["lineCarInformationList"].length;
			            for (j = 0; j < linelen; j ++){
				            lineNa = data[i]["lineCarInformationList"][j]["lineNo"];
				            lineNo = data[i]["lineCarInformationList"][j]["gprsId"];
				            lineCo = data[i]["lineCarInformationList"][j]["count"];
				            buslink = "http://realtimebus-h5.oss-cn-hangzhou.aliyuncs.com/index.html#/lineDetails?lineId="+ lineNo +"&stationName=" + station;
				            buslink = encodeURI(buslink);
				            innerH += "<div data-info class=\"busline\"  onclick=\"location.href='"+ buslink +"';\" align=\"center\">"+ lineNa + "(" + lineCo + ")" +"</div>";
			            }
			            innerH += "</div>";
		            }
		            document.getElementById("info").innerHTML = innerH;
	            }
	            else{
		        document.getElementById("info").innerHTML = "请打开手机定位，并给予定位权限！GPS error";
	            }
		    },
		    error: function (err) {
			    $("#info").text(JSON.stringify(err));
			    console.log(err);
		    },
        });
    }
})

export default startLocation
