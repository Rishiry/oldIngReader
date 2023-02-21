import csv
import re
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import tqdm


def read_csv(filename):
    with open(filename, 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        return [dict(zip(header, map(str, row))) for row in reader]


def get_categories(type):

    if type == '?' or type == '' or type.lower() == 'nan':
        return []

    subcategories = re.findall(r'\(.*?\)', type)

    for subcategory in subcategories:
        type = type.replace(subcategory, '')

    categories = type.split(",")
    categories = list(map(lambda x: x.strip().strip("()"), categories))
    return categories


def get_countries(status):
    countries = {'US': False, 'EU': False, 'AU': False}

    if 'u' in status:
        countries['US'] = True
    if 'e' in status:
        countries['EU'] = True
    if 'a' in status:
        countries['AU'] = True

    return countries


def get_formatted_data():
    raw = read_csv('data.csv')
    formatted = []

    for point in raw:

        formatted.append({
            'code': point['code'],
            'names': point['names'],
            'categories': get_categories(point['type']),
            'countries': get_countries(point['status'])
        })

    return formatted


def make_document(point, db):
    doc_ref = db.collection('INS/additives/individual').document(str(point['code']))
    point.pop('code')
    doc_ref.set(point)

def main():
    cred = credentials.Certificate("./addicheck-tcd-firebase-adminsdk-t7a9x-4c527ef641.json")
    app = firebase_admin.initialize_app(cred)

    db = firestore.client()

    formatted = get_formatted_data()

    for point in tqdm.tqdm(formatted):
        make_document(point, db)

if __name__ == '__main__':
    main()