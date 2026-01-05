---
title: 新版百度地图安卓sdk api定位
date: 2021-03-16 20:40:27
tags:
---

```java
package com.example.Qfrost;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.baidu.location.BDAbstractLocationListener;
import com.baidu.location.BDLocation;
import com.baidu.location.LocationClient;
import com.baidu.location.LocationClientOption;

// 超详细的Android百度地图开发 https://blog.csdn.net/Hanghang_/article/details/87207093
public class MainActivity extends AppCompatActivity {

    public LocationClient mLocationClient;
    //private MapView mapview;
    private TextView positionText;
    private StringBuilder currentPosition;
    private static final int WRITE_COARSE_LOCATION_REQUEST_CODE = 0;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mLocationClient = new LocationClient((getApplicationContext()));
        mLocationClient.registerLocationListener(new MyLocationListener());

        setContentView(R.layout.activity_main);


        positionText = (TextView) findViewById(R.id.textView2);
        positionText.setText("Listener starting...");

        requestPermission();

    }
    private final int REQUEST_CODE_ADDRESS = 100;


    /*初始化函数，并启动位置客户端LocationClient*/
    private void requestLocation() {
        initLocation();
        mLocationClient.start();
    }

    /*初始化函数*/
    private void initLocation() {
        LocationClientOption option = new LocationClientOption();

        option.setScanSpan(1000);
        option.setLocationNotify(true);

        mLocationClient.setLocOption(option);
    }

    /*只有同意打开相关权限才可以开启本程序*/
    private static final int REQUEST_CODE_ACCESS_COARSE_LOCATION = 1;

    private void requestPermission() {
        //Android 6.0判断用户是否授予定位权限
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {//如果 API level 是大于等于 23(Android 6.0) 时
            //判断是否具有权限
            if (ContextCompat.checkSelfPermission(this,
                    Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                //判断是否需要向用户解释为什么需要申请该权限
                if (ActivityCompat.shouldShowRequestPermissionRationale(this,
                        Manifest.permission.ACCESS_COARSE_LOCATION)) {
                    Toast.makeText(MainActivity.this,"自Android 6.0开始需要打开位置权限",Toast.LENGTH_SHORT).show();
                }
                //请求权限
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.ACCESS_COARSE_LOCATION},
                        REQUEST_CODE_ACCESS_COARSE_LOCATION);
            }
            else {
                requestLocation() ;

            }
        }
    }


    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CODE_ACCESS_COARSE_LOCATION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                //用户允许改权限，0表示允许，-1表示拒绝 PERMISSION_GRANTED = 0， PERMISSION_DENIED = -1
                requestLocation() ;
                //这里进行授权被允许的处理
            } else {
                //permission denied, boo! Disable the functionality that depends on this permission.
                Toast.makeText(this, "必须同意所有权限才能使用本程序", Toast.LENGTH_SHORT).show();
            }
        } else {
            super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }

    public class MyLocationListener extends BDAbstractLocationListener {
        @Override 
        public void onReceiveLocation(final BDLocation location) {



            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    currentPosition = new StringBuilder();

                    currentPosition.append("时间:").append(location.getTime()).append("\n");
                    currentPosition.append("纬度:").append(location.getLatitude()).append("\n");
                    currentPosition.append("经度:").append(location.getLongitude()).append("\n");
                    currentPosition.append("定位方式：");
                    if (location.getLocType() == BDLocation.TypeGpsLocation) {
                        currentPosition.append("GPS");
                    } else if (location.getLocType() == BDLocation.TypeNetWorkLocation) {
                        currentPosition.append("网络");
                    }
                    positionText.setText(currentPosition);
                }
            });
        }
    }


    public void onConnectHotSpotMessage(String s, int i) {

    }
    @Override
    protected void onDestroy(){
        super.onDestroy();
        mLocationClient.stop();
    }

}
```

