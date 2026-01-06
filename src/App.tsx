import React, { useState, useRef } from 'react';
import './styles/App.css';

function App() {
  const [inputValue, setInputValue] = useState<string>('');
  const [localDomainsInput, setLocalDomainsInput] = useState<string>('.uk\n.co.uk\n.org.uk\n.me.uk');
  const [pseudoLocalDomainsInput, setPseudoLocalDomainsInput] = useState<string>('.gb.net\n.uk.com\n.uk.net');
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRun = () => {
    if (!inputValue.trim()) {
      inputRef.current?.focus();
      return;
    }

    // Подготовка бренда
    const originalBrand = inputValue.trim();
    let cleanBrand = originalBrand.toLowerCase().replace(/\s+casino\s*/i, '');
    const isTwoWordBrand = /\s+/.test(cleanBrand) || /-/.test(cleanBrand);

    const brandVariants = {
      exact: cleanBrand.replace(/[-\s]/g, ''),
      withHyphen: cleanBrand.replace(/\s+/g, '-'),
      withCasino: cleanBrand.replace(/[-\s]/g, '') + 'casino'
    };

    // Парсинг доменов
    const localDomainsList = localDomainsInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(tld => tld.startsWith('.') ? tld : `.${tld}`);

    const pseudoLocalDomainsList = pseudoLocalDomainsInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(tld => tld.startsWith('.') ? tld : `.${tld}`);

    const newLines = [];
    let itemCounter = 1;

    // ПРИОРИТЕТ №1: Точное вхождение с .casino
    newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №1: Точное вхождение с .casino' });
    newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.exact}.casino` });

    if (isTwoWordBrand) {
      newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.withHyphen}.casino` });
    }

    // ПРИОРИТЕТ №1.1: Домены .bet и .win
    if (brandVariants.exact.endsWith('bet') || brandVariants.exact.endsWith('win')) {
      newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №1.1: Специальные зоны .bet/.win' });

      if (brandVariants.exact.endsWith('bet')) {
        const brandWithoutBet = brandVariants.exact.replace(/bet$/, '');
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandWithoutBet}.bet` });
      }

      if (brandVariants.exact.endsWith('win')) {
        const brandWithoutWin = brandVariants.exact.replace(/win$/, '');
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandWithoutWin}.win` });
      }
    }

    // ПРИОРИТЕТ №1.2: Общие доменные зоны
    newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №1.2: Общие домены (.com, .net, .org)' });

    const commonTlds = ['.com', '.net', '.org'];
    commonTlds.forEach(tld => {
      newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.exact}${tld}` });
      newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.withCasino}${tld}` });
    });

    // ПРИОРИТЕТ №1.3: Локальные домены
    if (localDomainsList.length > 0) {
      newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №1.3: Локальные домены' });

      localDomainsList.forEach(tld => {
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.exact}${tld}` });
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.withCasino}${tld}` });
      });
    }

    // ПРИОРИТЕТ №2: Варианты с дефисом
    if (isTwoWordBrand) {
      newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №2: Варианты с дефисом (ограниченно)' });

      const hyphenTlds = ['.net', '.org'];
      hyphenTlds.forEach(tld => {
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.withHyphen}${tld}` });
      });
    }

    // ПРИОРИТЕТ №3: Псевдо-локальные домены
    if (pseudoLocalDomainsList.length > 0) {
      newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №3: Псевдо-локальные домены' });

      pseudoLocalDomainsList.forEach(tld => {
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.exact}${tld}` });
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.withCasino}${tld}` });
      });
    }

    // ПРИОРИТЕТ №4: Обратное название
    if (cleanBrand.startsWith('casino')) {
      newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №4: Обратное название' });

      const reversedBrand = cleanBrand.replace(/^casino/, '');
      newLines.push({ type: 'item', text: `${itemCounter++}) ${reversedBrand}.com` });
    }

    // Конвертируем в строки для отображения
    const outputStrings = newLines.map(line => line.text);
    setOutputLines(outputStrings);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setOutputLines([]);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRun();
    }
  };

  return (
    <div className="container">
      <h1 className="title">Подбор доменов для казино</h1>

      {/* Основное поле ввода бренда */}
      <div className="inputGroup">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите название бренда (например: VeryWell casino или Spinbuddha)..."
          className="input"
          autoFocus
        />

        <div className="buttonGroup">
          <button onClick={handleRun} className="runButton">
            Запуск подбора
          </button>
          <button onClick={handleClear} className="clearButton">
            Очистить
          </button>
        </div>
      </div>

      {/* Контейнер для настроек доменов */}
      <div className="domainsSettingsContainer">

        {/* Локальные домены */}
        <div className="domainsGroup">
          <div className="domainsHeader">
            <label htmlFor="localDomains">
              Локальные домены
            </label>
          </div>
          <textarea
            id="localDomains"
            value={localDomainsInput}
            onChange={(e) => setLocalDomainsInput(e.target.value)}
            placeholder="Введите локальные доменные зоны..."
            className="domainsTextarea"
            rows={3}
          />
          <div className="domainsHint">
            Пример [ .uk .co.uk .org.uk .me.uk ] - каждый с новой строки
          </div>
        </div>

        {/* Псевдо-локальные домены */}
        <div className="domainsGroup">
          <div className="domainsHeader">
            <label htmlFor="pseudoDomains">
              Псевдо-локальные домены
            </label>
          </div>
          <textarea
            id="pseudoDomains"
            value={pseudoLocalDomainsInput}
            onChange={(e) => setPseudoLocalDomainsInput(e.target.value)}
            placeholder="Введите псевдо-локальные доменные зоны..."
            className="domainsTextarea"
            rows={3}
          />
          <div className="domainsHint">
            Пример [  .gb.net .uk.com .uk.net ] - каждый с новой строки
          </div>
        </div>

      </div>

      <div className="outputContainer">
        <div className="outputHeader">
          <h3>Результаты подбора доменов</h3>
          <div className="outputActions">
            <span className="counter">
              {outputLines.filter(line => line.includes(') ')).length} вариантов
            </span>
            {outputLines.length > 0 && (
              <button
                onClick={() => navigator.clipboard.writeText(outputLines.join('\n'))}
                className="copyButton"
              >
                Копировать всё
              </button>
            )}
          </div>
        </div>

        {outputLines.length === 0 ? (
          <div className="emptyState">
            <div className="emptyIcon">🔍</div>
            <div>Введите название бренда и нажмите "Запуск подбора"</div>
            <div className="emptyHint">Примеры: VeryWell casino, Spinbuddha, Bethall</div>
          </div>
        ) : (
          <div className="output">
            {outputLines.map((line, index) => {
              const isHeader = line.startsWith('ПРИОРИТЕТ');
              const isItem = !isHeader && line.includes(') ');

              return (
                <div
                  key={index}
                  className={`outputLine ${isHeader ? 'outputHeaderLine' : ''} ${isItem ? 'outputItem' : ''}`}
                >
                  {line}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;