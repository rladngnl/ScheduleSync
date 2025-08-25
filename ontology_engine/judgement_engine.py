import json
import re
import glob
import os
from rdflib import Graph as RdfGraph, Namespace as RdfNamespace, RDF, RDFS, Literal, XSD
from owlready2 import *
from collections import defaultdict

# --- 네임스페이스 정의 ---
# rdflib의 Namespace를 사용합니다.
EX = RdfNamespace("http://www.tackle_judgement.com/ontology#")

# --- 매핑 정보 ---
boolean_property_map = {
    "slide": EX.isSliding, "extend": EX.isExtending, "lying": EX.isLying,
    "stand": EX.isStanding, "fall": EX.isFalling, "tackle": EX.isTackling,
    "intercept": EX.isIntercepting
}

def sanitize_for_uri(text):
    """URI에 사용할 수 없는 문자를 정리하는 함수"""
    s = re.sub(r'\W+', '_', str(text))
    if s and s[0].isdigit():
        s = '_' + s
    return s

# --- 1부: JSON to RDF 변환 함수 ---
def json_to_rdf(json_data, video_id, frame_id):
    g = RdfGraph()
    g.bind("ex", EX)
    
    safe_video_id = sanitize_for_uri(video_id)
    frame_uri = EX[f"{safe_video_id}_Frame_{frame_id}"]
    g.add((frame_uri, RDF.type, EX.Frame))

    player_actions = defaultdict(set)
    for action in json_data.get("key_actions", []):
        safe_actor_id = sanitize_for_uri(action["actor_id"])
        player_actions[safe_actor_id].add(action["action_type"].lower())

    for obj in json_data.get("key_objects", []):
        safe_obj_id = sanitize_for_uri(obj["id"])
        obj_uri = EX[f"{safe_video_id}_{safe_obj_id}"]
        obj_class = EX.Player if "Player" in obj["id"] else EX.Ball
        g.add((obj_uri, RDF.type, obj_class))
        g.add((obj_uri, RDFS.label, Literal(obj["id"])))

        if "Player" in obj["id"]:
            state_uri = EX[f"{safe_video_id}_ActionState_{safe_obj_id}_F{frame_id}"]
            g.add((state_uri, RDF.type, EX.ActionState))
            g.add((obj_uri, EX.hasActionState, state_uri))
            g.add((state_uri, EX.occursInFrame, frame_uri))

            performed = player_actions.get(safe_obj_id, set())
            for action_type, bool_prop in boolean_property_map.items():
                g.add((state_uri, bool_prop, Literal(action_type in performed, datatype=XSD.boolean)))
    
    return g

# --- 2부: RDF 추론 및 쿼리 함수 ---
def reason_and_query(base_ontology_path, instances_folder_path, classes_to_find):
    
    onto = get_ontology(f"file://{os.path.abspath(base_ontology_path)}").load()

    instance_files = sorted(glob.glob(os.path.join(instances_folder_path, '*.rdf')))
    if not instance_files:
        print(f"경고: '{instances_folder_path}' 폴더에 분석할 RDF 파일이 없습니다.")
        return {}, None
        
    for rdf_file in instance_files:
        onto.imported_ontologies.append(get_ontology(f"file://{os.path.abspath(rdf_file)}").load())

    print("\nHermiT 추론을 시작합니다...")
    with onto:
        sync_reasoner_hermit()
    print("추론이 완료되었습니다.")

    # 지정된 클래스 인스턴스 검색
    class_results = {}
    for class_name in classes_to_find:
        query = f"PREFIX ex: <http://www.tackle_judgement.com/ontology#> SELECT ?i ?l WHERE {{ ?i a ex:{class_name} . OPTIONAL {{ ?i rdfs:label ?l . }} }}"
        results = list(default_world.sparql(query))
        class_results[class_name] = [{"uri": r[0].iri, "label": str(r[1]) if len(r) > 1 else "N/A"} for r in results]
    
    # ActionState 상세 정보 검색
    actionstate_query = """
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX ex: <http://www.tackle_judgement.com/ontology#>
        SELECT ?playerLabel ?property ?value WHERE {
          ?player a ex:Player . ?player rdfs:label ?playerLabel .
          ?player ex:hasActionState ?state . ?state ?property ?value .
          FILTER(?property != rdf:type)
        } ORDER BY ?playerLabel
    """
    actionstate_results = list(default_world.sparql(actionstate_query))
    player_states = defaultdict(dict)
    for row in actionstate_results:
        player_label, prop, value = str(row[0]), str(row[1]).split('#')[-1], row[2]
        value_str = str(value).split('#')[-1] if isinstance(value, Thing) else str(value)
        player_states[player_label][prop] = value_str
        
    return class_results, player_states

# --- 3부: 메인 실행 블록 ---
if __name__ == "__main__":
    # --- 설정 변수 ---
    BASE_ONTOLOGY_FILE = "tackle_test.owl"
    JSON_INPUT_FOLDER = "json_input"
    RDF_OUTPUT_FOLDER = "rdf_output"
    CLASSES_TO_FIND = ["Tackler", "Tacklee"]
    OUTPUT_TXT_FILE = "summary_report.txt"

    # --- 1단계: JSON to RDF 변환 ---
    print("="*40 + "\n단계 1: JSON to RDF 변환을 시작합니다.\n" + "="*40)
    if os.path.exists(RDF_OUTPUT_FOLDER):
        for file in glob.glob(os.path.join(RDF_OUTPUT_FOLDER, '*')): os.remove(file)
    os.makedirs(RDF_OUTPUT_FOLDER, exist_ok=True)
    
    json_file_list = glob.glob(os.path.join(JSON_INPUT_FOLDER, '*.json'))
    if not json_file_list:
        print(f"'{JSON_INPUT_FOLDER}' 폴더에 처리할 JSON 파일이 없습니다.")
    else:
        for json_file_path in json_file_list:
            try:
                with open(json_file_path, "r", encoding="utf-8") as f: wrapper_data = json.load(f)
                filename = wrapper_data.get("filename", os.path.basename(json_file_path))
                match = re.search(r'(.+)_(\d+)\.(txt|json)', filename)
                video_id, frame_id = (match.group(1), int(match.group(2))) if match else (os.path.splitext(os.path.basename(json_file_path))[0], 0)
                content_string = wrapper_data.get('content', json.dumps(wrapper_data))
                if content_string.strip().startswith("```json"): content_string = content_string.strip()[7:-4]
                data = json.loads(content_string)
                graph = json_to_rdf(data, video_id, frame_id)
                base_filename = f"{sanitize_for_uri(video_id)}_{frame_id:04d}"
                output_rdf_path = os.path.join(RDF_OUTPUT_FOLDER, f"{base_filename}.rdf")
                graph.serialize(destination=output_rdf_path, format="xml")
                print(f"✅ '{json_file_path}' -> '{output_rdf_path}' 변환 완료.")
            except Exception as e:
                print(f"❌ '{json_file_path}' 처리 중 오류 발생: {e}")

    # --- 2단계: 누적 추론 및 결과 수집 ---
    print("\n" + "="*40 + "\n단계 2: 누적 RDF 데이터 추론을 시작합니다.\n" + "="*40)
    report_string = ""
    try:
        results_by_class, actionstate_details = reason_and_query(BASE_ONTOLOGY_FILE, RDF_OUTPUT_FOLDER, CLASSES_TO_FIND)

        # --- 3단계: 결과 요약 문자열 생성 ---
        report_string += "="*30 + "\n      최종 추론 결과 요약\n" + "="*30
        for class_name, instances_found in results_by_class.items():
            if instances_found:
                report_string += f"\n\n✅ 총 {len(instances_found)}개의 '{class_name}' 인스턴스를 찾았습니다:"
                for instance in instances_found:
                    report_string += f"\n  - Label: {instance['label']} (URI: {instance['uri']})"
            else:
                report_string += f"\n\n❌ '{class_name}' 클래스로 분류된 인스턴스를 찾지 못했습니다."
        
        report_string += "\n\n" + "-"*40
        report_string += "\n\n✅ 선수별 최종 ActionState 상세 정보:"
        if not actionstate_details:
            report_string += "\n  - 조회된 ActionState 정보가 없습니다."
        else:
            for player, properties in actionstate_details.items():
                report_string += f"\n\n  ▶ Player: {player}"
                for prop, value in properties.items():
                    report_string += f"\n    - {prop}: {value}"
        report_string += "\n\n" + "="*40

    except Exception as e:
        report_string = f"❌ 오류가 발생했습니다: {e}"

    # --- 4단계: 요약 결과를 .txt 파일로 저장 ---
    with open(OUTPUT_TXT_FILE, "w", encoding="utf-8") as f:
        f.write(report_string)
    
    print(f"\n\n✅ 모든 작업 완료! 최종 결과가 '{OUTPUT_TXT_FILE}' 파일에 저장되었습니다.")