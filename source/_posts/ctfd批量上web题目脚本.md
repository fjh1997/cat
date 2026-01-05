---
title: ctfd批量上web题目脚本
date: 2021-07-08 12:55:22
tags:
---

```bash
import requests
r = requests.get('https://hub.docker.com/v2/repositories/ctftraining/?page_size=88')
challenges=[]
f=open("challenge.sql","w+")
q=open("pull.sh","w+")
f.write("set character_set_client='utf8mb4';\nset character_set_connection='utf8mb4';\nset character_set_results='utf8mb4';\n")
q.write("strings=(\n")

for item in r.json()['results']:
	challenge={}
	challenge['title']=item['name']
	challenge['description']=item['description']
	challenges.append(challenge)
for challenge in challenges:
    f.write("""INSERT INTO challenges
      ( name ,  description ,  max_attempts ,  value ,  category,  type,  state ,  requirements)
    VALUES ('"""+challenge["title"]+"','"+ challenge['description'].replace("'", "''")+"""',0,100,'web','dynamic_docker','visible',NULL);
    set @challenge_id=(SELECT LAST_INSERT_ID());\nINSERT INTO dynamic_docker_challenge(id,initial,minimum,decay,memory_limit,cpu_limit,dynamic_score,docker_image,redirect_type,redirect_port)
 VALUES (@challenge_id,200,1,100,'128m',0.5,1,'ctftraining/"""+challenge["title"]+"','direct',80);\n")
    q.write("ctftraining/"+challenge["title"]+"\n")
q.write(")\n"+"""
for i in "${strings[@]}"; do
    docker pull "$i"
done
""")
f.close()

```
以上脚本需要注意。sql里面遇到'需要转义的话就变成''即可，不是\'
之后sql直接导入，shell自己执行即可。

```bash
sudo docker exec -i ctfd_db_1 mysql -uctfd -pctfd ctfd < challenge.sql
sudo docker exec -i ctfd_db_1 mysql -uctfd -pctfd -e "use ctfd;select * from challenges;"
```

