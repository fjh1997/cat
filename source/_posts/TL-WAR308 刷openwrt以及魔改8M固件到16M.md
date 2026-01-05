---
title: TL-WAR308 刷openwrt以及魔改8M固件到16M
date: 2021-10-13 20:16:34
tags:
---

原厂固件就是openwrt的，但是内核版本太低了，升级下比较好。
理论上也支持 TL-wvr1300g 或者AC系列
拆机后使用编程器刷入breed：
https://breed.hackpascal.net/breed-qca953x-letv-lba-047-ch.bin
再刷入openwrt：https://downloads.openwrt.org/releases/19.07.8/targets/ath79/generic/openwrt-19.07.8-ath79-generic-tplink_tl-wr810n-v2-squashfs-factory.bin

就可以了。


可能开启wifi还需要原厂的art分区固件，原厂是32KB的，但是breed刷的需要64KB，就填充了32k个F。
下载链接：https://download.csdn.net/download/fjh1997/32620590

编程器固件：
openwrt 19: https://download.csdn.net/download/fjh1997/32621251


openwrt 21:
链接: https://pan.baidu.com/s/1QtrquLhoya8N56woPxxrbw 提取码: elwp 

## 扩展分区大小到16M
既然tl-wr810n的固件恰好时候我们的这个路由，那么我们就基于tl-wr810n的配置进行编译，编译的方法就是修改设备树里面的flash为16M的，主要是模仿了tl-wr810 v2的设备树,因为cpu是一样的，都是9533的cpu。
路径：
openwrt/target/linux/ath79/dts/qca9533_tplink_tl-wr810n-v2.dts

```bash
// SPDX-License-Identifier: GPL-2.0-or-later OR MIT

#include "qca953x_tplink_tl-wr810n.dtsi"

/ {
	compatible = "tplink,tl-wr810n-v2", "qca,qca9533";
	model = "TP-Link TL-WR810N v2";
};
```
看到了里面include了qca953x_tplink_tl-wr810n.dtsi，进去看看.
注意到里面的flash定义 是针对8M的。
```bash
&spi {
	status = "okay";

	flash@0 {
		compatible = "jedec,spi-nor";
		reg = <0>;
		spi-max-frequency = <25000000>;

		partitions {
			compatible = "fixed-partitions";
			#address-cells = <1>;
			#size-cells = <1>;

			uboot: partition@0 {
				label = "u-boot";
				reg = <0x000000 0x020000>;
				read-only;
			};

			partition@20000 {
				compatible = "tplink,firmware";
				label = "firmware";
				reg = <0x020000 0x7d0000>;
			};

			art: partition@7f0000 {
				label = "art";
				reg = <0x7f0000 0x010000>;
				read-only;
			};
		};
	};
};
```
需要匹配16M的flash芯片进行修改

```bash
&spi {
	status = "okay";

	flash@0 {
		compatible = "jedec,spi-nor";
		reg = <0>;
		spi-max-frequency = <25000000>;

		partitions {
			compatible = "fixed-partitions";
			#address-cells = <1>;
			#size-cells = <1>;

			uboot: partition@0 {
				label = "u-boot";
				reg = <0x000000 0x020000>;
				read-only;
			};

			partition@20000 {
				compatible = "tplink,firmware";
				label = "firmware";
				reg = <0x020000 0xfd0000>;
			};

			art: partition@ff0000 {
				label = "art";
				reg = <0xff0000 0x010000>;
				read-only;
			};
		};
	};
};
```
修改完毕之后还要对内核镜像进行修改：
修改前是8M，在openwrt/target/linux/ath79/image/generic-tp-link.mk文件里面定义，这个镜像格式是一个镜像头加上lzma的数据。针对tl-wr810N v2，

修改前：

```bash
define Device/tplink_tl-wr810n-v2
  $(Device/tplink-8mlzma)
  SOC := qca9533
  DEVICE_MODEL := TL-WR810N
  DEVICE_VARIANT := v2
  TPLINK_HWID := 0x8100002
  SUPPORTED_DEVICES += tl-wr810n-v2
endef
TARGET_DEVICES += tplink_tl-wr810n-v2```
```
修改后：

```bash
define Device/tplink_tl-wr810n-v2
  $(Device/tplink-16mlzma)
  SOC := qca9533
  DEVICE_MODEL := TL-WR810N
  DEVICE_VARIANT := v2
  TPLINK_HWID := 0x8100002
  SUPPORTED_DEVICES += tl-wr810n-v2
endef
TARGET_DEVICES += tplink_tl-wr810n-v2
```
之后编译即可。
