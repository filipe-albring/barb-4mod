"use strict";
function aplicarMascaraData(campo) {
    campo.addEventListener('input', () => {
        let valor = campo.value.replace(/\D/g, '').slice(0, 8);
        if (valor.length >= 5) {
            valor = valor.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
        }
        else if (valor.length >= 3) {
            valor = valor.replace(/(\d{2})(\d{1,2})/, '$1/$2');
        }
        campo.value = valor;
    });
}
function inicializarMascaras() {
    const camposData = document.querySelectorAll('.mascara-data');
    camposData.forEach((campo) => {
        aplicarMascaraData(campo);
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => inicializarMascaras());
}
else {
    inicializarMascaras();
}
