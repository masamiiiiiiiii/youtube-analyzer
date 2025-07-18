# Pythonの公式イメージをベースにする
FROM python:3.9-slim-buster

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係ファイルをコピー
COPY api/requirements.txt .

# 依存関係をインストール
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコードをコピー
COPY api/ .

# ポート8000を公開
EXPOSE 8080

# Uvicornを使ってFastAPIアプリケーションを起動
CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8080"]
