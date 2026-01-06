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

    // === ПРИОРИТЕТ №1: Точное вхождение с .casino ===
    newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №1: Точное вхождение с .casino' });
    newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.exact}.casino` });

    if (isTwoWordBrand) {
      newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.withHyphen}.casino` });
    }

    // === ПРИОРИТЕТ №1.1: Домены .bet и .win ===
    newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №1.1: Специальные зоны .bet/.win' });

    if (brandVariants.exact.endsWith('bet')) {
      const brandWithoutBet = brandVariants.exact.replace(/bet$/, '');
      newLines.push({ type: 'item', text: `${itemCounter++}) ${brandWithoutBet}.bet` });
    }

    if (brandVariants.exact.endsWith('win')) {
      const brandWithoutWin = brandVariants.exact.replace(/win$/, '');
      newLines.push({ type: 'item', text: `${itemCounter++}) ${brandWithoutWin}.win` });
    }

    // === ПРИОРИТЕТ №1.2: Общие доменные зоны ===
    newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №1.2: Общие домены (.com, .net, .org)' });

    const commonTlds = ['.com', '.net', '.org'];
    commonTlds.forEach(tld => {
      newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.exact}${tld}` });
      newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.withCasino}${tld}` });
    });

    // === ПРИОРИТЕТ №1.3: Локальные домены ===
    if (localDomainsList.length > 0) {
      newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №1.3: Локальные домены' });

      localDomainsList.forEach(tld => {
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.exact}${tld}` });
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.withCasino}${tld}` });
      });
    }

    // === ПРИОРИТЕТ №2: Варианты с дефисом ===
    if (isTwoWordBrand) {
      newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №2: Варианты с дефисом (ограниченно)' });

      const hyphenTlds = ['.net', '.org'];
      hyphenTlds.forEach(tld => {
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.withHyphen}${tld}` });
      });
    }

    // === ПРИОРИТЕТ №3: Псевдо-локальные домены ===
    if (pseudoLocalDomainsList.length > 0) {
      newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №3: Псевдо-локальные домены' });

      pseudoLocalDomainsList.forEach(tld => {
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.exact}${tld}` });
        newLines.push({ type: 'item', text: `${itemCounter++}) ${brandVariants.withCasino}${tld}` });
      });
    }

    // === ПРИОРИТЕТ №4: Обратное название ===
    if (cleanBrand.startsWith('casino')) {
      newLines.push({ type: 'header', text: 'ПРИОРИТЕТ №4: Обратное название' });

      const reversedBrand = cleanBrand.replace(/^casino/, '');
      newLines.push({ type: 'item', text: `${itemCounter++}) ${reversedBrand}.com` });
    }

    // === ИНФОРМАЦИЯ ===
    newLines.push({ type: 'header', text: 'ИНФОРМАЦИЯ' });
    newLines.push({ type: 'info', text: `• Исходный бренд: ${originalBrand}` });
    newLines.push({ type: 'info', text: `• Обработанный бренд: ${brandVariants.exact}` });
    newLines.push({ type: 'info', text: `• Тип бренда: ${isTwoWordBrand ? 'Двухсловный' : 'Однословный'}` });
    newLines.push({ type: 'info', text: `• Локальных доменов: ${localDomainsList.length} шт.` });
    newLines.push({ type: 'info', text: `• Псевдо-локальных доменов: ${pseudoLocalDomainsList.length} шт.` });
    newLines.push({ type: 'info', text: `• Всего вариантов: ${itemCounter - 1}` });
    newLines.push({ type: 'info', text: `• Обработано: ${new Date().toLocaleTimeString()}` });

    // Конвертируем в строки для отображения
    const outputStrings = newLines.map(line => line.text);
    setOutputLines(prev => [...prev, ...outputStrings]);
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

  const handleResetLocalDomains = () => {
    setLocalDomainsInput('.uk\n.co.uk\n.org.uk\n.me.uk');
  };

  const handleResetPseudoDomains = () => {
    setPseudoLocalDomainsInput('.gb.net\n.uk.com\n.uk.net');
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
            Очистить результаты
          </button>
        </div>
      </div>

      {/* Контейнер для настроек доменов */}
      <div className="domainsSettingsContainer">

        {/* Локальные домены */}
        <div className="domainsGroup">
          <div className="domainsHeader">
            <label htmlFor="localDomains">
              Локальные домены (Приоритет 1.3):
              <span className="domainsCount">
                {localDomainsInput.split('\n').filter(l => l.trim().length > 0).length}
              </span>
            </label>
            <button onClick={handleResetLocalDomains} className="resetButton">
              Сбросить
            </button>
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
            Пример: .uk, .co.uk, .org.uk, .me.uk
          </div>
        </div>

        {/* Псевдо-локальные домены */}
        <div className="domainsGroup">
          <div className="domainsHeader">
            <label htmlFor="pseudoDomains">
              Псевдо-локальные домены (Приоритет 3):
              <span className="domainsCount">
                {pseudoLocalDomainsInput.split('\n').filter(l => l.trim().length > 0).length}
              </span>
            </label>
            <button onClick={handleResetPseudoDomains} className="resetButton">
              Сбросить
            </button>
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
            Пример: .gb.net, .uk.com, .uk.net
          </div>
        </div>

      </div>

      <div className="stats">
        <span>Всего вариантов доменов: {outputLines.filter(line => !line.startsWith('ПРИОРИТЕТ') && !line.startsWith('ИНФОРМАЦИЯ') && !line.startsWith('•')).length}</span>
        {outputLines.length > 0 && (
          <button
            onClick={() => navigator.clipboard.writeText(outputLines.join('\n'))}
            className="copyButton"
          >
            Копировать всё
          </button>
        )}
      </div>

      <div className="outputContainer">
        <h3 className="outputTitle">Результаты подбора доменов:</h3>
        {outputLines.length === 0 ? (
          <div className="emptyState">
            Введите название бренда и нажмите "Запуск подбора"...
          </div>
        ) : (
          <div className="output">
            {outputLines.map((line, index) => {
              // Определяем тип строки для стилей
              const isHeader = line.startsWith('ПРИОРИТЕТ') || line.startsWith('ИНФОРМАЦИЯ');
              const isInfo = line.startsWith('•');
              const isItem = !isHeader && !isInfo && line.includes(') ');

              return (
                <div
                  key={index}
                  className={`outputLine ${isHeader ? 'outputHeader' : ''} ${isInfo ? 'outputInfo' : ''} ${isItem ? 'outputItem' : ''}`}
                >
                  {line}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="instructions">
        <p><strong>Как использовать:</strong></p>
        <ul className="instructionList">
          <li><strong>1.</strong> Введите название бренда (например: "VeryWell casino")</li>
          <li><strong>2.</strong> Настройте локальные и псевдо-локальные домены при необходимости</li>
          <li><strong>3.</strong> Нажмите "Запуск подбора" или Enter</li>
          <li><strong>4.</strong> Все домены генерируются по алгоритму с указанными приоритетами</li>
          <li><strong>5.</strong> Используйте "Сбросить" для возврата к стандартным настройкам</li>
        </ul>
      </div>
    </div>
  );
}

export default App;