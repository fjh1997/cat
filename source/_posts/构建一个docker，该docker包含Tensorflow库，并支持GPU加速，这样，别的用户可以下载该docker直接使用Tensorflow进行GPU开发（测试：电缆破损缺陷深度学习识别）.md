---
title: >-
  构建一个docker，该docker包含Tensorflow库，并支持GPU加速，这样，别的用户可以下载该docker直接使用Tensorflow进行GPU开发（测试：电缆破损缺陷深度学习识别）
abbrlink: 40921
date: 2019-06-19 19:24:45
tags:
---

# 选题5：构建一个docker，该docker包含Tensorflow库，并支持GPU加速，这样，别的用户可以下载该docker直接使用Tensorflow进行GPU开发
>浙江理工大学 云计算课程 期末选题
>镜像搭建详情请看视频https://www.bilibili.com/video/av56054503
## OverView
因为GPU属于特定的厂商产品，需要特定的driver，Docker本身并不支持GPU。以前如果要在Docker中使用GPU，就需要在container中安装主机上使用GPU的driver，然后把主机上的GPU设备（例如：/dev/nvidia0）映射到container中。所以这样的Docker image并不具备可移植性。
Nvidia-docker项目就是为了解决这个问题，它让Docker image不需要知道底层GPU的相关信息，而是通过启动container时mount设备和驱动文件来实现的
本次实验旨在实现在一台主机上配置GPU开发环境，并通过docker打包成镜像后能在另外一台完全不同环境的主机上运行。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/b2fd09653998927ff90fa1bab9c13e79.png)
## 实验环境
### 打包环境
#### 软件
>ubuntu 18.04
<br>cuda 9.0
<br>cudnn 7.0.5
<br>nvidia-driver 390.116
#### 硬件
>CPU:i7 5960x
<br>内存：16GB ddr4
<br>显卡：GTX 1080 Ti 11GB
### 测试环境
### 软件
>kali
<br>cuda 10.2
<br>cudnn 无
<br>nvidia-driver 430.14 
### 硬件
>CPU：i5 6200u
<br>内存：8GB ddr4
<br>显卡：940 MX 2GB
## 1.安装docker与nvidia-docker
```sh
#安装docker
sudo apt-get update
sudo apt-get install \
apt-transport-https \
ca-certificates \
curl \
software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository \
"deb [arch=amd64] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) \
stable"
sudo apt-get update
sudo apt-get install docker-ce
sudo docker run hello-world
#安装nvida-docker
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | \
  sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/ubuntu18.04/nvidia-docker.list | \
  
sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update
#安装nvidia-docker2软件包并重新加载docker守护程序配置
sudo apt-get install nvidia-docker2

sudo pkill -SIGHUP dockerd

docker run --runtime=nvidia --rm nvidia/cuda nvidia-smi

```
## 拉取带有cuda的ubuntu镜像，在镜像里安装cudnn、tensorflow等
```bash
nvidia-docker run --rm nvidia/cuda /bin/bash
cd cuda/include
sudo cp cudnn.h /usr/local/cuda/include  #复制头文件
cd cuda/lib64
sudo cp lib* /usr/local/cuda/lib64/    #复制动态链接库
cd /usr/local/cuda/lib64/
sudo rm -rf libcudnn.so libcudnn.so.7     
sudo ln -s libcudnn.so.7.0.5 libcudnn.so.7  
sudo ln -s libcudnn.so.7 libcudnn.so
apt-get update
apt-get install python-dev
apt-get install python-pip
.........                   #存在大量繁琐的图形依赖库配置，略去。
pip install tensorflow-gpu==1.10.0

```
## 测试成功后对镜像进行打包
```bash
sudo nvidia-docker commit <imageID> <imageName>:<imageVersion>
sudo nvidia-docker save -o NewImages.tar <imageName>:<imageVersion>
```

## 另一台主机用户获得镜像后进行测试
### 载入打包好的镜像
```bash
sudo nvidia-docker load < NewImages.tar
sudo nvidia-docker run -it  <imageName>:<imageVersion>
```
### 测试内容
使用深度学习训练好的模型。通过视频识别高压电线缺陷
### 测试tensorflow运行情况
```python
import time
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
from utils import label_map_util
from utils import visualization_utils as vis_util

PATH_TO_CKPT = 'output.pb'
PATH_TO_LABELS = 'label_map.pbtxt'
NUM_CLASSES = 3


def get_results(boxes, classes, scores, category_index, im_width, im_height,
    min_score_thresh=.5):
    bboxes = list()
    for i, box in enumerate(boxes):
        if scores[i] > min_score_thresh:
            ymin, xmin, ymax, xmax = box
            bbox = {
                'bbox': {
                    'xmax': xmax * im_width,
                    'xmin': xmin * im_width,
                    'ymax': ymax * im_height,
                    'ymin': ymin * im_height
                },
                'category': category_index[classes[i]]['name'],
                'score': float(scores[i])
            }
            bboxes.append(bbox)
    return bboxes


label_map = label_map_util.load_labelmap(PATH_TO_LABELS)
detection_graph = tf.Graph()
config = tf.ConfigProto()
categories = label_map_util.convert_label_map_to_categories(
    label_map, max_num_classes=NUM_CLASSES, use_display_name=True)
category_index = label_map_util.create_category_index(categories)


def object_detection_init():
    with detection_graph.as_default():
        od_graph_def = tf.GraphDef()
        with tf.gfile.GFile(PATH_TO_CKPT, 'rb') as fid:
            serialized_graph = fid.read()
            od_graph_def.ParseFromString(serialized_graph)
            tf.import_graph_def(od_graph_def, name='')
    # config = tf.ConfigProto()
    config.gpu_options.allow_growth = True


def object_detection_api():
    count = 0
    with detection_graph.as_default():
        with tf.Session(graph=detection_graph, config=config) as sess:
            start_time = time.time()
            print(time.ctime())
            test_annos = dict()

            cap = cv2.VideoCapture("1.mp4")

            fps = cap.get(cv2.CAP_PROP_FPS)
            width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
            height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
            videoWriter = cv2.VideoWriter("output.mp4", cv2.VideoWriter_fourcc('m', 'p', '4', 'v'), fps, (int(width), int(height)))

            while (cap.isOpened()):
                ret, frame = cap.read()
                if ret == True:
                    frame = cv2.flip(frame, 0)

                    # image = Image.open("1.jpg")
                    image_np = np.array(frame).astype(np.uint8)
                    im_height, im_width, _ = image_np.shape
                    image_np_expanded = np.expand_dims(image_np, axis=0)
                    image_tensor = detection_graph.get_tensor_by_name('image_tensor:0')
                    boxes = detection_graph.get_tensor_by_name('detection_boxes:0')
                    scores = detection_graph.get_tensor_by_name('detection_scores:0')
                    classes = detection_graph.get_tensor_by_name('detection_classes:0')
                    num_detections = detection_graph.get_tensor_by_name('num_detections:0')
                    (boxes, scores, classes, num_detections) = sess.run(
                        [boxes, scores, classes, num_detections],
                        feed_dict={image_tensor: image_np_expanded})
                    print('{} elapsed time: {:.3f}s'.format(time.ctime(), time.time() - start_time))
                    test_annos["imgefeerefdfd"[0:5]] = {'objects': get_results(np.squeeze(boxes), np.squeeze(classes).astype(np.int32), np.squeeze(scores), category_index,im_width, im_height)}

                    vis_util.visualize_boxes_and_labels_on_image_array(
                        image_np, np.squeeze(boxes), np.squeeze(classes).astype(np.int32), np.squeeze(scores),
                        category_index, use_normalized_coordinates=True, line_thickness=8)
                    videoWriter.write(image_np)
                    count = count + 1
                    cv2.imwrite("output/"+str(count)+".jpg",image_np)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                else:
                    break

            cap.release()
            videoWriter.release()

if __name__=="__main__":
    object_detection_init()
    object_detection_api()
```
```bash
python test.py
```
### 测试结果
<br>脚本运行情况：
<br>![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/b38902c05fbba6eb59c9e77da1b53fe5.png)
<br>GPU占用率：
<br>![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/0fb8679d7494f5a2bc6d35d2bd805e76.png)
<br>脚本处理结果：
<br>![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/4237b68921646fc8fe738be9c3ad768b.png)
## 总结成果
经过测试，Nvidia-docker打包后的镜像可以在不同linux内核、发行版，不同nvidia驱动、显卡型号的情况下运行，具有较好的可移植性和快速开发部署优势。
docker镜像现已上传到docker hub ，可以用以下命令获取
```bash
docker pull fjh1997/cable-breakage-detection
```
其中的测试脚本名称有所改动，test.py更名为为cable-detect.py
