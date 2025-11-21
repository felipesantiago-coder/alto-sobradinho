#!/bin/bash

# Arquivo de atualização de preços do Alto do Horizonte
# Autor: Sistema
# Data: 25/11/2025

# Função para atualizar um valor específico
atualizar_valor() {
  local arquivo="$1"
  bloco="$2"
  unidade="$3"
  novo_valor="$4"
  
  # Usa sed para fazer a substituição
  sed -i "s/${bloco}-${unidade}: {[^}]*valor: '[^}]*'[^}]*'/, \"valor: '${novo_valor}'\" \"${arquivo}\""
}

# Chamar a função
atualizar_valor