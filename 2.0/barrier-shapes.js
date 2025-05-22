// Padrões de peças únicas para barreiras aleatórias (relativos)
export const randomPatterns = [
    // Linha horizontal (3 blocos)
    [ { dx: 0, dz: 0 }, { dx: 1, dz: 0 }, { dx: 2, dz: 0 } ],
    // Linha vertical (3 blocos)
    [ { dx: 0, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: 2 } ],
    // L pequeno
    [ { dx: 0, dz: 0 }, { dx: 1, dz: 0 }, { dx: 1, dz: 1 } ],
    // L invertido
    [ { dx: 0, dz: 0 }, { dx: 0, dz: 1 }, { dx: 1, dz: 1 } ],
    // U pequeno
    [ { dx: 0, dz: 0 }, { dx: 1, dz: 0 }, { dx: 2, dz: 0 }, { dx: 0, dz: 1 }, { dx: 2, dz: 1 } ],
    // T pequeno
    [ { dx: 0, dz: 0 }, { dx: -1, dz: 1 }, { dx: 0, dz: 1 }, { dx: 1, dz: 1 } ],
    // Bloco 2x2
    [ { dx: 0, dz: 0 }, { dx: 1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 1, dz: 1 } ],
    // Linha de 4 horizontal
    [ { dx: 0, dz: 0 }, { dx: 1, dz: 0 }, { dx: 2, dz: 0 }, { dx: 3, dz: 0 } ],
    // Linha de 4 vertical
    [ { dx: 0, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: 2 }, { dx: 0, dz: 3 } ],
    // L grande
    [ { dx: 0, dz: 0 }, { dx: 1, dz: 0 }, { dx: 2, dz: 0 }, { dx: 2, dz: 1 } ],
    // U grande
    [ { dx: 0, dz: 0 }, { dx: 2, dz: 0 }, { dx: 0, dz: 1 }, { dx: 1, dz: 1 }, { dx: 2, dz: 1 } ],
    // T grande
    [ { dx: 0, dz: 0 }, { dx: -1, dz: 1 }, { dx: 0, dz: 1 }, { dx: 1, dz: 1 }, { dx: 0, dz: 2 } ],
    // S (zig-zag)
    [ { dx: 0, dz: 1 }, { dx: 1, dz: 1 }, { dx: 1, dz: 0 }, { dx: 2, dz: 0 } ],
    // Z (zig-zag)
    [ { dx: 0, dz: 0 }, { dx: 1, dz: 0 }, { dx: 1, dz: 1 }, { dx: 2, dz: 1 } ],
    // Diagonal ↘ (principal)
    [ { dx: 0, dz: 0 }, { dx: 1, dz: 1 }, { dx: 2, dz: 2 } ],
    [ { dx: 0, dz: 0 }, { dx: 1, dz: 1 }, { dx: 2, dz: 2 }, { dx: 3, dz: 3 } ],
    // Diagonal ↙ (secundária)
    [ { dx: 0, dz: 0 }, { dx: -1, dz: 1 }, { dx: -2, dz: 2 } ],
    [ { dx: 0, dz: 0 }, { dx: -1, dz: 1 }, { dx: -2, dz: 2 }, { dx: -3, dz: 3 } ]
];