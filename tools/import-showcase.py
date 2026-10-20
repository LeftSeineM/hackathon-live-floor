"""Export reviewed archive entries only; never publish the raw registration/archive JSON."""
import argparse, hashlib, json, re, urllib.request
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

SUMMARIES = {
4: '校园学习与生活整合平台，把论文阅读、学习任务、自动排程、一周日程和专注陪伴连接起来，帮助学生从计划走向执行。校园生活推荐模块使用演示地点，展示需求与时间、预算约束的核对过程。',
5: '离线优先的 Android 健身执行辅助 App，将训练安排、每组重量、组间休息计时和饮食记录放在同一入口；可选联网使用 AI 图片识别。',
6: '校园学习空间发现器，帮助同学围绕时间、空间与信息寻找学习场所。',
7: '真人对战 AI 的体感街机格斗游戏，用身体动作参与交互，将运动节奏转化为游戏体验。',
8: 'Course Replay 学习材料回顾工具，支持 PDF、PPTX、Markdown 和 TXT 文件上传；提交实现采用 FastAPI、SQLAlchemy 和 SQLite。',
9: '面向本科生科研入门，将公开科研资料、技能目录、个人经历证据、团队探索和准备练习串成可操作的流程，帮助学生判断研究方向与需要补足的能力。',
10: '为多人科创中的独立 AI 会话提供共同的项目记忆，将任务、依赖与工作上下文保存在同一后端，支持任务规划、草案编辑和协作交接。',
11: '校园学习辅助平台，整合材料问答、费曼自测、课程学习和论文阅读，将学习资料与主动复习连接起来。',
12: '输入一句话或一段故事开头，生成连续的分支剧情。每个节点提供三种选择，以离奇但美好的结局和 Q 版漫画插画构建互动阅读体验。',
13: '把作业任务、题面确认、双版本作答、自查依据和课表安排连接起来，帮助学生复习并追踪学习进度。',
14: '整合校内食堂、校外堂食与外卖信息，以位置、饭后返寝方向和人流等条件辅助选餐。包含首页、随机选餐、发现好吃的和觅食地图，并提供 Android 宿主与共用前端。',
15: '用 Chrome 右侧知识图组织 AI 对话中的问题、会话与来源关系，让分散在多个会话中的学习内容更容易查找、回顾与继续探索。',
16: '围绕当下心情提供音乐与 MAD 风格同步字幕，用轻量的视听体验陪伴用户表达情绪。',
17: '面向电子系同学的校园资讯与机会管理平台，将公开通知整理为可搜索的资讯、可核对的申请机会和可回溯的日程。',
18: '康神开播了队提交的游戏类作品《清华弈事》。已归档作品包与主界面截图，可在这里查看作品画面。',
19: '期末周主题的浏览器塔防游戏：分配精力建造与升级防御塔，抵挡作业、实验报告和考试；结合经营布阵、音乐节拍与连击机制保护 GPA。',
20: '以清华大学电子工程系的校园生活为起点，在学业、娱乐、健康、人际关系与职业选择间分配资源，通过分支叙事体验不同的人生路径。',
21: '塑造建筑，聆听城市回应。六座程序化建筑组成可演奏的声学网络，高度决定音高，相邻建筑的音程影响回应关系，结合三维画面、声音与手势交互。',
22: '双人同屏的二维太空合作游戏。两名玩家分别控制吸引与排斥力场，利用惯性和天体引力护送失去主引擎的方舟，穿越太阳系、虫洞与黑洞。',
23: '像素校园策略游戏，将熟悉的课堂与休息场景设计为有选择和策略的互动体验，可通过桌面浏览器游玩。',
25: '互动桌面宠物小生态，可喂养、逗笑和观察奶龙，并通过配种推演体验外观遗传，让学习与工作间隙多一点轻量陪伴。',
26: '把校园分支剧情与轻运动结合，通过挥手、拳击等体感动作参与故事，帮助主角应对质疑、建立自信。',
27: '面向 5–9 人的实时网页派对推理游戏，以淘金小镇为背景，结合隐藏身份、夜间技能、轮流发言与公开投票，并由服务端同步房间状态。',
28: '围绕聊天中的回复困惑，结合上下文提供可复制的回复建议与可追问的分析。文字推测用于辅助理解，不等同于对他人真实心理的判断。',
29: '课堂与会议中的重点回放助手，围绕用户关注的问题识别值得保留的时刻，关联字幕、音频、屏幕画面和时间位置，便于会后核对原始证据。',
30: '面向本科生科研入门的智能科研探索辅助平台，帮助学生开展科研方向探索。',
33: '万圣节主题悬疑推理游戏，通过场景探索、角色视角切换、线索调查与证据整理推进案件，并依据最终指控进入不同结果。',
34: '在 OneTHU 上增加 Windows 学习桌宠，将作业任务与截止倒计时悬浮展示，并通过桌宠入口连接本机课程资料工具。',
35: '将食物链、身份声明与质疑规则组合成中文卡牌游戏，支持与 AI 或朋友进行推理、诈唬和合作；2v2 模式通过担保、盲传与分阶段传屏组织协作。',
36: '清华校园主题的同屏策略桌游，在熟悉的地点权衡学业、人际、幸福与资源消耗，把一个学期走成不同的经历。',
37: '整理清华校内外公开资讯，生成个人信息日报与每日简报，帮助同学集中获取有用的信息。',
38: '面向小组协作的排期工具，整理成员可行时间与每周安排，寻找共同空闲时段。',
39: '电路仿真工作台，将电路设计与仿真服务器操作集中在桌面界面中，辅助电路实验与验证。',
40: '使用 Ren’Py 制作的校园恋爱视觉小说，以剧本、美术和互动叙事呈现校园故事；提交材料包含游戏源码、运行素材与 Web 试玩产物。',
41: '课程规划助手，收集和整理学习安排信息，辅助形成课程与学习计划。',
43: 'Windows 互动桌宠，提供陪伴、许愿和小剧场；在用户主动触发时读取当前游戏截图并给出基于画面的评论。',
44: '将个人表达变成可以探索和分享的星球：以视觉标签呈现整体气质，以角色承载兴趣与音乐偏好，为社交提供轻松的话题入口。',
45: '清华校园日常主题的三维互动游戏。跟随纸鸟“小折”与校园人物交谈、整理线索卡并选择故事收尾，把普通的相遇收进《园中拾页册》。',
46: '将象棋、围棋、军棋、狼人杀和纸牌题材组合成单人卡牌 Roguelike，在同一棋盘体验部署、走位、攻击、防守与卡组构筑，完成五层冒险。',
47: '把可互动的像素小岛放在真实桌面上，用风雨、植物、动物和专注计时提供陪伴；支持花园照料、声音送风和局域网手机共玩。',
48: '把烦恼变成 .exe 进程、压力变成精神 CPU、陪伴变成桌宠，以可点击和可重启的精神桌面承载情绪表达，并为真实待办的完成提供反馈。',
49: '在不换宿舍、不移动固定家具的前提下，帮助学生判断物品能否放下，通过腾桌和换季收纳改善学习与生活空间。'
}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--archive',required=True)
    parser.add_argument('--floor-snapshot',help='Optional saved public /api/live-floor response')
    args=parser.parse_args()
    archive=Path(args.archive).resolve()
    root=Path(__file__).resolve().parents[1]
    source=archive/'作品核对.json'
    entries=json.loads(source.read_text(encoding='utf-8'))['entries']
    confirmations_path=archive/'公开展示确认.json'
    confirmations=json.loads(confirmations_path.read_text(encoding='utf-8'))['teams'] if confirmations_path.exists() else {}
    if args.floor_snapshot:
        live=json.loads(Path(args.floor_snapshot).read_text(encoding='utf-8-sig'))
    else:
        request=urllib.request.Request('https://wenjuan.leftseinem.dpdns.org/api/live-floor',headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(request,timeout=25) as r: live=json.load(r)
    live_by_id={t['id']:t for t in live['teams']}
    track_names={t['id']:t['name'] for t in live['tracks']}
    images_root=root/'assets/showcase'; images_root.mkdir(parents=True,exist_ok=True)
    (root/'data').mkdir(exist_ok=True); (root/'qa').mkdir(exist_ok=True)
    (root/'private-backups').mkdir(exist_ok=True)
    projects=[]; audit=[]; used=[]
    for e in entries:
        if not e['submitted']: continue
        tid=e['id']; current=live_by_id.get(tid)
        if not current or current['displayName']!=e['team'] or track_names[current['trackId']]!=e['track']:
            raise ValueError('Team identity mismatch: '+str(tid))
        if tid not in SUMMARIES: raise ValueError('Needs reviewed summary: '+str(tid))
        folders=[p for p in (archive/'按赛道作品集'/e['track']).iterdir() if p.is_dir() and p.name.startswith(f'{tid:02d} ') and '签到编号待核' not in p.name]
        if len(folders)!=1: raise ValueError('Ambiguous folder: '+str(tid))
        gallery=folders[0]/'界面截图'
        candidates=sorted(p for p in gallery.glob('*') if p.suffix.lower() in ['.png','.jpg','.jpeg']) if gallery.exists() else []
        # Prefer individually labeled screenshots; retain the verified overview as fallback.
        candidates=[p for p in candidates if '拼接' not in p.name]
        covers=sorted((p for p in (archive/'主界面截图').glob(f'{tid:02d} *') if p.suffix.lower() in ['.png','.jpg','.jpeg']),key=lambda p:(p.suffix.lower()!='.png',p.name))
        if not candidates and covers: candidates=[covers[0]]
        confirmed=confirmations.get(str(tid))
        # Historical cover was ambiguous; only the owner's explicit confirmation resolves it.
        if tid==29 and not confirmed: candidates=[]
        confirmed_labels={}
        if confirmed:
            candidates=[]
            for item in confirmed['images']:
                path=(archive/item['path']).resolve()
                if not path.is_relative_to(archive) or not path.is_file():raise ValueError('Invalid confirmed image: '+str(tid))
                candidates.append(path);confirmed_labels[path]=item['alt']
        images=[]; hashes=set()
        for path in candidates:
            digest=hashlib.sha256(path.read_bytes()).hexdigest()
            if digest in hashes: continue
            hashes.add(digest)
            dest=images_root/f'team-{tid:02d}-{len(images)+1:02d}.webp'
            with Image.open(path) as im:
                picture=ImageOps.exif_transpose(im).convert('RGB')
                # Publish only the product window, excluding the adjacent personal chat client.
                if tid==28: picture=picture.crop((0,0,round(picture.width*.499),round(picture.height*.955)))
                picture.thumbnail((1920,2560) if confirmed else (1920,1200),Image.Resampling.LANCZOS)
                picture.save(dest,'WEBP',quality=90 if confirmed else 88,method=6)
            label=confirmed_labels.get(path) or (re.sub(r'^\d+[- ]','',path.stem) if path.parent.name=='界面截图' else e['title']+' · 主界面')
            images.append({'src':'./'+dest.relative_to(root).as_posix(),'alt':label})
            audit.append({'teamId':tid,'source':str(path),'sourceSha256':digest,'published':dest.relative_to(root).as_posix()})
            used.append((tid,dest))
        projects.append({'id':f'team-{tid}-project','teamId':tid,'teamName':e['team'],'trackId':current['trackId'],'trackName':e['track'],'title':confirmed.get('title',e['title']) if confirmed else e['title'],'summary':confirmed.get('summary',SUMMARIES[tid]) if confirmed else SUMMARIES[tid],'award':bool(e['award']),'images':images})
    updated_at=max(['2026-10-19']+[c.get('confirmedAt','2026-10-19') for c in confirmations.values()])
    data={'version':1,'updatedAt':updated_at,'projects':projects}
    expected={p.resolve() for _,p in used}
    for old in images_root.glob('team-*.webp'):
        if old.resolve() not in expected: old.unlink()
    (root/'data/showcase.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (root/'private-backups/showcase-import-audit.json').write_text(json.dumps({'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'images':audit,'confirmedTeamIds':sorted(map(int,confirmations)),'unpublishedTeamIds':[e['id'] for e in entries if not e['submitted']]},ensure_ascii=False,indent=2),encoding='utf-8')
    for page in range((len(used)+11)//12):
        chunk=used[page*12:(page+1)*12]; contact=Image.new('RGB',(1500,4*260),'#202124'); draw=ImageDraw.Draw(contact)
        for i,(tid,file) in enumerate(chunk):
            with Image.open(file) as im:
                im.thumbnail((490,225)); x=(i%3)*500+(500-im.width)//2; y=(i//3)*260+25; contact.paste(im,(x,y))
                draw.text(((i%3)*500+8,(i//3)*260+5),file.name,fill='white')
        contact.save(root/f'qa/showcase-contact-{page+1}.jpg')
    print(json.dumps({'projects':len(projects),'images':len(used),'teamsWithImages':sum(bool(p['images']) for p in projects),'imageBytes':sum(p.stat().st_size for _,p in used),'missingTeams':[e['id'] for e in entries if not e['submitted']]},ensure_ascii=False))

if __name__=='__main__': main()
