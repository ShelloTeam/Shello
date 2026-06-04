#!/bin/bash

# Cores para o terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # Sem cor

echo -e ""
echo -e "${CYAN}=== Setup do Shello Mobile (Linux/macOS) ===${NC}"
echo -e ""

# Verifica pré-requisitos
if ! command -v node &> /dev/null; then
    echo -e "${RED}Erro: Node.js não encontrado. Instale em: https://nodejs.org/${NC}"
    exit 1
fi

node_version=$(node -v | tr -d 'v')
node_major=$(echo "$node_version" | cut -d. -f1)

if [ "$node_major" -lt 18 ]; then
    echo -e "${RED}Erro: Node.js v$node_version encontrado. Requer v18+.${NC}"
    exit 1
fi

echo -e "${GREEN}Pré-requisitos OK (Node.js v$node_version)${NC}"
echo -e ""

# [1/3] Verifica make
echo -e "${YELLOW}[1/3] Verificando make...${NC}"
if command -v make &> /dev/null; then
    echo -e "      make já instalado, pulando."
else
    echo -e "      ${YELLOW}Aviso: 'make' não está instalado.${NC}"
    echo -e "      Instale via seu gerenciador de pacotes (ex: 'sudo apt install build-essential')."
fi

# [2/3] Dependências do frontend
echo -e ""
echo -e "${YELLOW}[2/3] Instalando dependências do projeto (React Native + Expo)...${NC}"
if [ -d "frontend" ]; then
    cd frontend || exit 1
    npm install
    cd ..
    echo -e "${GREEN}      Dependências instaladas com sucesso!${NC}"
else
    echo -e "${RED}Erro: Pasta 'frontend' não encontrada!${NC}"
    exit 1
fi

# [3/3] eas-cli global
echo -e ""
echo -e "${YELLOW}[3/3] Instalando eas-cli...${NC}"
if command -v eas &> /dev/null; then
    echo -e "      eas-cli já instalado, pulando."
else
    echo -e "      Tentando instalar eas-cli globalmente..."
    if npm install -g eas-cli; then
        echo -e "${GREEN}      eas-cli instalado!${NC}"
    else
        echo -e "${YELLOW}      Não foi possível instalar globalmente sem permissão de superusuário.${NC}"
        echo -e "      Tente rodar manualmente: ${CYAN}sudo npm install -g eas-cli${NC}"
    fi
fi

echo -e ""
echo -e "${CYAN}=== Setup concluído! ===${NC}"
echo -e ""
echo -e "Próximos passos:"
echo -e "  1. Para rodar o app no Expo Go:  ${GREEN}make dev${NC}"
echo -e "  2. Para gerar APK de teste:      ${GREEN}make apk${NC} (requer 'eas login')"
echo -e "  3. Para validar tipos (TS):      ${GREEN}make check${NC}"
echo -e ""
