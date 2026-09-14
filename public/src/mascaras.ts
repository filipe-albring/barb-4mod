function aplicarMascaraData(campo: HTMLInputElement): void {
    campo.addEventListener('input', (): void => {
        let valor = campo.value.replace(/\D/g, '').slice(0, 8);

        if (valor.length >= 5) {
            valor = valor.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
        } else if (valor.length >= 3) {
            valor = valor.replace(/(\d{2})(\d{1,2})/, '$1/$2');
        }

        campo.value = valor;
    });
}

function inicializarMascaras(): void {
    const camposData = document.querySelectorAll<HTMLInputElement>('.mascara-data');
    camposData.forEach((campo: HTMLInputElement): void => {
        aplicarMascaraData(campo);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', (): void => inicializarMascaras());
} else {
    inicializarMascaras();
}
