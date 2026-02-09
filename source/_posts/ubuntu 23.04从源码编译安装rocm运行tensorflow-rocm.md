---
title: ubuntu 23.04从源码编译安装rocm运行tensorflow-rocm
abbrlink: 63629
date: 2023-11-16 19:29:43
tags:
---

因为ubuntu22.04的RDP不支持声音转发，所以下载了ubuntu23.04.但官方的rocm二进制包最高只支持ubuntu22.04，不支持ubuntu 23.04，只能自己从源码编译虽然有网友告诉我可以用docker运行rocm。但是我已经研究了好几天，沉没成本太多，无奈只能继续硬着头皮研究，终于搞定了。记录下结果，可能有遗漏，顺序也可能不对，仅供参考。如果CMAKE有错误可以试试添加或者删除`-DCMAKE_PREFIX_PATH="/opt/rocm/"`,毕竟为了避免冲突，rocm的库独立于系统主库了。

首先，要明确一点，rocm安装的位置在`/opt/rocm/`目录下，而rocm-llvm工具链安装目录为`/opt/rocm/llvm`这个可以通过解包官方的deb包来知道。注意不要把`/opt/rocm/llvm`目录下的东西安装到`/opt/rocm/`目录下不然会报错，注意这个`-DCMAKE_INSTALL_PREFIX="/opt/rocm/"`参数指定安装位置（默认是`/usr/local`）。

如果不小心装错位置了，可以使用命令

```bash
sudo grep -lrIZ "https://llvm.org/LICENSE.txt " . | sudo xargs -0 rm -f --
```
删除LLVM`/opt/rocm/lib`目录下相关的库。

## 一、编译安装llvm-rocm工具链
安装这个工具链之前，确保已经有其他工具链已经被安装。可以是llvm也可以是gnu。建议第一次make install的时候不要加sudo，避免装错位置。


```bash
mkdir -p /opt/rocm/llvm
cd
git clone https://github.com/RadeonOpenCompute/llvm-project.git -b amd-stg-open
cd 
mkdir build
cd build/
cmake -DCMAKE_BUILD_TYPE=Release -DLLVM_ENABLE_PROJECTS="clang;lld" 
-DLLVM_ENABLE_RUNTIMES="libcxx;libcxxabi;libunwind;compiler-rt"
-DLLVM_TARGETS_TO_BUILD='AMDGPU;X86'
-DCMAKE_INSTALL_PREFIX=/opt/rocm/llvm
 ../llvm
sudo make install
cd ../amd/device-libs
mkdir build
cmake \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_PREFIX_PATH="/opt/rocm/llvm" \
    -DCMAKE_INSTALL_PREFIX=/opt/rocm/ \
    ..
sudo make install
cd ../amd/comgr
mkdir build
cmake \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_PREFIX_PATH="/opt/rocm/llvm;/opt/rocm/" \
    -DCMAKE_INSTALL_PREFIX=/opt/rocm/ \
    ..
sudo make install
```
## 二、编译安装hip工具链
参考：https://github.com/ROCm-Developer-Tools/HIP/blob/develop/docs/developer_guide/build.md
```bash
sudo apt-get install -y libelf-dev
export ROCM_BRANCH=rocm-5.7.x
git clone -b "$ROCM_BRANCH" https://github.com/ROCm-Developer-Tools/clr.git
git clone -b "$ROCM_BRANCH" https://github.com/ROCm-Developer-Tools/hip.git
git clone -b "$ROCM_BRANCH" https://github.com/ROCm-Developer-Tools/HIPCC.git hipcc
export CLR_DIR="$(readlink -f clr)"
export HIP_DIR="$(readlink -f hip)"
export HIPCC_DIR="$(readlink -f hipcc)"
cd "$HIPCC_DIR"
mkdir -p build; cd build
cmake  ..
make -j4
cd "$CLR_DIR"
mkdir -p build; cd build
cmake -DHIP_COMMON_DIR=$HIP_DIR -DHIP_PLATFORM=amd -DCMAKE_PREFIX_PATH="/opt/rocm/" -DCMAKE_INSTALL_PREFIX=/opt/rocm/ -DHIPCC_BIN_DIR=$HIPCC_DIR/build -DHIP_CATCH_TEST=0 -DCLR_BUILD_HIP=ON -DCLR_BUILD_OCL=OFF ..
make -j$(nproc)
sudo make install

```

## 三、编译安装rocm-runtime
参考：https://github.com/RadeonOpenCompute/ROCR-Runtime/tree/master/src

```bash
git clone https://github.com/RadeonOpenCompute/ROCT-Thunk-Interface.git
mkdir -p ROCT-Thunk-Interface/build
cd ROCT-Thunk-Interface/build
cmake -DCMAKE_INSTALL_PREFIX=/opt/rocm ..
sudo make install
git clone https://github.com/RadeonOpenCompute/ROCR-Runtime.git
mkdir -p src/build
cd src/build
cmake -DCMAKE_INSTALL_PREFIX=/opt/rocm ..
sudo make install
```

## 四、编译安装rCCL
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/db2da2844b4995ddc04b8d98a157f250.png)



时间比较长占用内存六十多个G，如果内存不够的话可以加大swap文件或者使用zRAM。
```bash
sudo apt install zram-config
sudo nano /usr/bin/init-zram-swapping

```
把里面的`mem=$((totalmem / 2 *  1024))` 改为`mem=$((totalmem * 2 *  1024))`
然后reboot重启，这样就能使用自身内存两倍的zram

```bash
git clone https://github.com/RadeonOpenCompute/rocminfo.git -b rocm-5.7.x
cd rocminfo/
mkdir -p build
cd build
cmake -DCMAKE_PREFIX_PATH=/opt/rocm ..
sudo make install


python3 -m pip install CppHeaderParser 
git clone https://github.com/RadeonOpenCompute/rocm_smi_lib.git
cd rocm_smi_lib/
mkdir -p build
cd build
cmake ..
sudo make install 
git clone https://github.com/ROCmSoftwarePlatform/rccl.git
cd rccl
sudo ./install.sh -i
```
## 五、设置环境变量
参考：https://docs.amd.com/en/docs-5.1.3/deploy/linux/os-native/install.html
```bash
sudo tee --append /etc/ld.so.conf.d/rocm.conf <<EOF
/opt/rocm/lib
/opt/rocm/lib64
EOF
sudo ldconfig
```
## 六、安装tensorflow-rocm测试

```bash
sudo apt install tensorflow-rocm scikit-learn scipy matplotlib
```
然后测试

## 可能遇到的错误：

> Could not find NUMA using the following names: numa

解决办法:
```bash
apt-get install libnuma-dev
```
> rocm_smi/rocm_smi.h' file not found

解决办法: 参考步骤四安装smi库

> importError: cannot import name 'np_utils' from 'keras.utils'

解决办法: 修改代码，直接ffrom keras import utils 然后 utils.to_categorical(...)

> librccl.so.1: cannot open shared object file: No such file or directory

解决方法：完成步骤四

> lang: error: invalid target ID 'gfx941'; format is a processor name followed by an optional colon-delimited list of features followed by an enable/disable sign (e.g., 'gfx908:sramecc+:xnack-')

解决方法：完成步骤一、安装最新rocm-llvm工具链且确保设置`-DCMAKE_PREFIX_PATH="/opt/rocm/"`

> Could not find a configuration file for package "hsa-runtime64"

解决方法：完成步骤三
