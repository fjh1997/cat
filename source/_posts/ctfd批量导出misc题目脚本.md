---
title: ctfd批量导出misc题目脚本
abbrlink: 50568
date: 2021-07-07 15:14:10
tags:
---

```python
import os
import subprocess
import shutil
lines=subprocess.check_output("docker exec ctfd_db_1 mysql -uctfd -pctfd -e \"set character_set_results='utf8';use ctfd;select * from challenges join flags on challenges.id=flags.challenge_id left join files on challenges.id=files.challenge_id where category = 'misc' and description='easy' ;\"",shell=True,text=True).splitlines()[1:]
challenges=[]
f=open("challenge.sql","w+")
f.write("set character_set_client='utf8mb4';\nset character_set_connection='utf8mb4';\nset character_set_results='utf8mb4';\n")

for line in lines:
    challenge={}
    obj=line.split("\t")
    title=obj[1]
    flag=obj[12]
    fpath=obj[16]
    os.makedirs(os.path.dirname("uploads/"+fpath), exist_ok=True)
    shutil.copy("/home/ec2-user/CTFd/.data/CTFd/uploads/"+fpath,"uploads/"+fpath)
    search=next((item for item in challenges if item["title"] == title),None)
    if search:
        search["fpath"].append(fpath)
    else :
        challenge["title"]=title
        challenge["flag"]=flag
        challenge["fpath"]=[]
        challenge["fpath"].append(fpath)
        challenges.append(challenge)
for challenge in challenges:
    f.write("""INSERT INTO challenges
      ( name ,  description ,  max_attempts ,  value ,  category,  type,  state ,  requirements)
    VALUES ('"""+challenge["title"]+"""','',0,100,'misc_easy','dynamic','visible',NULL);
    set @challenge_id=(SELECT LAST_INSERT_ID());\ninsert into dynamic_challenge (id,initial,minimum,decay) values (@challenge_id,100,10,20);
    insert into flags (challenge_id,type,content) values (@challenge_id,'static','"""+challenge["flag"]+"');\n")
    for item in challenge["fpath"]:
        f.write("insert into files (type,location,challenge_id) values ('challenge','"+item+"',@challenge_id);\n")
f.close()


```
之后把附件放到uploads下，并执行challenge.sql即可。

如果需要导出题目描述，且题目描述中有换行符：

```python
import os
import subprocess
import shutil
lines=subprocess.check_output("docker exec ctfd_db_1 mysql -uctfd -pctfd -e \"set character_set_results='utf8';use ctfd;select *,'xdm' from challenges join flags on challenges.id=flags.challenge_id left join files on challenges.id=files.challenge_id where category = 'crypto'  ;\"",shell=True,text=True).split("xdm\n")[1:]
challenges=[]
f=open("challenge.sql","w+")
f.write("set character_set_client='utf8mb4';\nset character_set_connection='utf8mb4';\nset character_set_results='utf8mb4';\n")

for line in lines:
    challenge={}
    obj=line.split("\t")
    if obj==['']:
        continue
    print(obj)
    title=obj[1]
    description=obj[2]
    flag=obj[12]
    category=obj[5]
    fpath=obj[16]
    os.makedirs(os.path.dirname("uploads/"+fpath), exist_ok=True)
    shutil.copy("/home/ec2-user/CTFd/.data/CTFd/uploads/"+fpath,"uploads/"+fpath)
    search=next((item for item in challenges if item["title"] == title),None)
    if search:
        search["fpath"].append(fpath)
    else :
        challenge["title"]=title
        challenge["flag"]=flag
        challenge["description"]=description
        challenge["category"]=category
        challenge["fpath"]=[]
        challenge["fpath"].append(fpath)
        challenges.append(challenge)
for challenge in challenges:
    f.write("""INSERT INTO challenges
      ( name ,  description ,  max_attempts ,  value ,  category,  type,  state ,  requirements)
    VALUES ('"""+challenge["title"]+"','"+challenge["description"]+"',0,100,'"+challenge["category"]+"""','dynamic','visible',NULL);
    set @challenge_id=(SELECT LAST_INSERT_ID());\ninsert into dynamic_challenge (id,initial,minimum,decay) values (@challenge_id,100,10,20);
    insert into flags (challenge_id,type,content) values (@challenge_id,'static','"""+challenge["flag"]+"');\n")
    for item in challenge["fpath"]:
        f.write("insert into files (type,location,challenge_id) values ('challenge','"+item+"',@challenge_id);\n")
f.close()
```

