import html2pdf from 'html2pdf.js';

export async function generatePdf(element: HTMLElement, fileName: string, format: string = 'a4') {
  if (!element) {
    throw new Error('Elemento para geração do PDF não foi fornecido.');
  }
  
  try {
    console.log(`Iniciando geração de PDF (Motor: html2pdf.js, Formato: ${format}) para:`, fileName);
    
    // Garantir que as imagens estão carregadas
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));

    // Pequeno delay para estabilização e renderização completa
    await new Promise(resolve => setTimeout(resolve, 1500));

    const opt: any = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        onclone: (clonedDoc: Document) => {
          // Remove or replace modern color functions that html2canvas cannot parse
          const styles = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styles.length; i++) {
            const style = styles[i];
            if (style.innerHTML.includes('oklch') || style.innerHTML.includes('oklab') || style.innerHTML.includes('color-mix')) {
              // Replace modern color functions with a safe fallback
              // This prevents the parser from crashing while keeping most styles
              style.innerHTML = style.innerHTML
                .replace(/oklch\([^)]+\)/g, '#000000')
                .replace(/oklab\([^)]+\)/g, '#000000')
                .replace(/color-mix\([^)]+\)/g, '#000000');
            }
          }
          
          // Also check inline styles and remove problematic variables
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            // Remove Tailwind v4 variables that might contain oklch/oklab
            if (el.style) {
              el.style.removeProperty('--tw-ring-color');
              el.style.removeProperty('--tw-shadow-color');
              el.style.removeProperty('--tw-ring-offset-color');
              
              if (el.style.color?.includes('okl') || el.style.color?.includes('color-mix')) el.style.color = '#000000';
              if (el.style.backgroundColor?.includes('okl') || el.style.backgroundColor?.includes('color-mix')) el.style.backgroundColor = '#ffffff';
              if (el.style.borderColor?.includes('okl') || el.style.borderColor?.includes('color-mix')) el.style.borderColor = '#000000';
            }
          }
        }
      },
      jsPDF: { 
        unit: 'mm', 
        format: format, 
        orientation: 'portrait',
        compress: true,
        precision: 16
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: ['.break-inside-avoid', 'tr', '.no-break', 'img', 'table']
      }
    };

    // Usando html2pdf para gerar o PDF respeitando quebras de página
    // Geramos como Blob para ter mais controle sobre o download e evitar extensão .bin
    const worker = html2pdf().set(opt).from(element);
    const pdfBlob = await worker.output('blob');
    
    // Garantir que o Blob tenha o tipo MIME correto
    const blob = new Blob([pdfBlob], { type: 'application/pdf' });
    
    // Criar URL para o Blob
    const url = URL.createObjectURL(blob);
    
    // Criar elemento de link temporário para forçar o download com o nome correto
    const link = document.createElement('a');
    link.href = url;
    
    // Garantir que o nome do arquivo seja seguro e termine com .pdf
    const sanitizedFileName = fileName
      .replace(/[/\\?%*:|"<>]/g, '-') // Remover caracteres inválidos para nomes de arquivo
      .trim();
    
    const finalFileName = sanitizedFileName.toLowerCase().endsWith('.pdf') 
      ? sanitizedFileName 
      : `${sanitizedFileName}.pdf`;
    
    link.download = finalFileName;
    
    // Adicionar ao corpo, clicar e remover
    document.body.appendChild(link);
    link.click();
    
    // Pequeno delay antes de limpar para garantir que o download iniciou
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
    
    console.log(`PDF gerado e download iniciado manualmente: ${finalFileName}`);
    return true;
  } catch (error) {
    console.error('Erro crítico na geração do PDF:', error);
    let message = 'Erro desconhecido';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    throw new Error(`Falha na geração do PDF: ${message}`);
  }
}

export async function sharePdf(element: HTMLElement, fileName: string, format: string = 'a4') {
  if (!element) {
    throw new Error('Elemento para geração do PDF não foi fornecido.');
  }

  try {
    console.log(`Iniciando geração de PDF para compartilhamento:`, fileName);
    
    // Garantir que as imagens estão carregadas
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));

    await new Promise(resolve => setTimeout(resolve, 1500));

    const opt: any = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        onclone: (clonedDoc: Document) => {
          // Remove or replace modern color functions that html2canvas cannot parse
          const styles = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styles.length; i++) {
            const style = styles[i];
            if (style.innerHTML.includes('oklch') || style.innerHTML.includes('oklab') || style.innerHTML.includes('color-mix')) {
              style.innerHTML = style.innerHTML
                .replace(/oklch\([^)]+\)/g, '#000000')
                .replace(/oklab\([^)]+\)/g, '#000000')
                .replace(/color-mix\([^)]+\)/g, '#000000');
            }
          }
          
          // Also check inline styles and remove problematic variables
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            if (el.style) {
              el.style.removeProperty('--tw-ring-color');
              el.style.removeProperty('--tw-shadow-color');
              el.style.removeProperty('--tw-ring-offset-color');
              
              if (el.style.color?.includes('okl') || el.style.color?.includes('color-mix')) el.style.color = '#000000';
              if (el.style.backgroundColor?.includes('okl') || el.style.backgroundColor?.includes('color-mix')) el.style.backgroundColor = '#ffffff';
              if (el.style.borderColor?.includes('okl') || el.style.borderColor?.includes('color-mix')) el.style.borderColor = '#000000';
            }
          }
        }
      },
      jsPDF: { 
        unit: 'mm', 
        format: format, 
        orientation: 'portrait',
        compress: true,
        precision: 16
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: ['.break-inside-avoid', 'tr', '.no-break', 'img', 'table']
      }
    };

    const worker = html2pdf().set(opt).from(element);
    const pdfBlob = await worker.output('blob');
    
    const sanitizedFileName = fileName
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim();
    
    const finalFileName = sanitizedFileName.toLowerCase().endsWith('.pdf') 
      ? sanitizedFileName 
      : `${sanitizedFileName}.pdf`;

    const file = new File([pdfBlob], finalFileName, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: finalFileName,
        text: `Documento: ${finalFileName}`
      });
      return true;
    } else {
      // Fallback para download se não puder compartilhar
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 200);
      throw new Error('Compartilhamento não suportado neste navegador. O arquivo foi baixado em vez disso.');
    }
  } catch (error) {
    console.error('Erro ao compartilhar PDF:', error);
    throw error;
  }
}
