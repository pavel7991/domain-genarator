import React, { useState, useRef } from 'react';
import './styles/App.css';

function App() {
  const [inputValue, setInputValue] = useState<string>('');
  const [globalDomainsInput, setGlobalDomainsInput] = useState<string>('.casino\n.bet\n.com\n.org\n.net\n.io\n.win\n.vegas\n.bingo');
  const [localDomainsInput, setLocalDomainsInput] = useState<string>('.uk\n.co.uk\n.org.uk\n.me.uk\n.gb.net\n.uk.com\n.uk.net');
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRun = () => {
    if (!inputValue.trim()) {
      inputRef.current?.focus();
      return;
    }

    // Подготовка бренда
    const originalBrand = inputValue.trim();

    // Проверяем, содержит ли ввод слово "casino"
    const containsCasinoWord = /\bcasino\b/i.test(originalBrand);

    let cleanBrand = originalBrand.toLowerCase().replace(/\s+casino\s*/i, '');
    const isTwoWordBrand = /\s+/.test(cleanBrand) || /-/.test(cleanBrand);

    // Основные варианты бренда
    const brandExact = cleanBrand.replace(/[-\s]/g, '');
    const brandWithHyphen = cleanBrand.replace(/\s+/g, '-');

    // withCasino варианты
    let brandWithCasino = brandExact;
    if (!brandExact.endsWith('casino')) {
      brandWithCasino = brandExact + 'casino';
    }

    // Вариант: exact + "-casino" (например "slotoking-casino")
    let brandExactHyphenCasino = brandExact;
    if (!brandExact.endsWith('casino')) {
      brandExactHyphenCasino = brandExact + '-casino';
    }

    const brandVariants = {
      exact: brandExact,
      withHyphen: brandWithHyphen,
      withCasino: brandWithCasino,
      exactHyphenCasino: brandExactHyphenCasino,
      // Флаг: был ли введен бренд со словом "casino"
      containsCasinoWord: containsCasinoWord
    };

    // Парсинг доменов
    const globalDomainsList = globalDomainsInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(tld => tld.startsWith('.') ? tld : `.${tld}`);

    const localDomainsList = localDomainsInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(tld => tld.startsWith('.') ? tld : `.${tld}`);

    // Разделяем глобальные домены по типам
    const specialDomains = ['.bet', '.win', '.vegas', '.bingo'];
    const casinoDomain = '.casino';
    const commonDomains = globalDomainsList.filter(
      domain => !specialDomains.includes(domain) && domain !== casinoDomain
    );

    const newLines: Array<{type: 'header' | 'item', text: string}> = [];

    // Вспомогательная функция для проверки, нужно ли исключать вариант
    const shouldExcludeVariant = (brand: string, domain: string) => {
      // Исключаем случаи типа "casino.casino", "verywellcasino.casino" и т.д.
      if (domain === '.casino' && (brand === 'casino' || brand.endsWith('casino'))) {
        return true;
      }
      return false;
    };

    // ПРИОРИТЕТ №1: Специальные зоны (.bet, .win, .vegas, .bingo) - если есть окончание
    const hasSpecialEnding = specialDomains.some(domain => {
      const ending = domain.substring(1); // Убираем точку
      return brandVariants.exact.endsWith(ending);
    });

    if (hasSpecialEnding) {
      newLines.push({ type: 'header', text: 'Специальные зоны (.bet/.win/.vegas/.bingo)' });

      // Собираем варианты для специальных зон
      const specialZoneItems: string[] = [];

      // Проверяем каждую специальную зону
      specialDomains.forEach(domain => {
        const ending = domain.substring(1); // Убираем точку
        if (brandVariants.exact.endsWith(ending)) {
          const brandWithoutEnding = brandVariants.exact.replace(new RegExp(`${ending}$`, 'i'), '');
          if (brandWithoutEnding) {
            // Для специальных зон: сначала exact, потом withCasino
            if (!shouldExcludeVariant(brandWithoutEnding, domain)) {
              specialZoneItems.push(`${brandWithoutEnding}${domain}`);
            }

            // withCasino вариант (только если не заканчивается на casino)
            let brandWithCasinoVariant = brandWithoutEnding;
            if (!brandWithoutEnding.endsWith('casino')) {
              brandWithCasinoVariant = brandWithoutEnding + 'casino';
            }
            if (!shouldExcludeVariant(brandWithCasinoVariant, domain)) {
              specialZoneItems.push(`${brandWithCasinoVariant}${domain}`);
            }
          }
        }
      });

      // Добавляем отсортированные items
      specialZoneItems.forEach(item => {
        newLines.push({ type: 'item', text: item });
      });
    }

    // ГЛОБАЛЬНЫЕ ДОМЕНЫ (включая .casino)
    const commonDomainItems: string[] = [];

    // Собираем домены .casino
    if (!shouldExcludeVariant(brandVariants.exact, '.casino')) {
      commonDomainItems.push(`${brandVariants.exact}.casino`);
    }

    if (isTwoWordBrand && !shouldExcludeVariant(brandVariants.withHyphen, '.casino')) {
      commonDomainItems.push(`${brandVariants.withHyphen}.casino`);
    }

    // Логика для остальных глобальных доменов (.com, .org, .net, .io)
    if (commonDomains.length > 0) {
      // Логика для брендов, введенных со словом "casino"
      if (brandVariants.containsCasinoWord) {
        // Показываем withCasino и exactHyphenCasino варианты
        commonDomains.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.withCasino, tld)) {
            commonDomainItems.push(`${brandVariants.withCasino}${tld}`);
          }
        });

        // Добавляем exactHyphenCasino варианты
        commonDomains.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exactHyphenCasino, tld)) {
            commonDomainItems.push(`${brandVariants.exactHyphenCasino}${tld}`);
          }
        });
      } else {
        // Для брендов без слова "casino" показываем все варианты

        // Сначала exact варианты
        commonDomains.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exact, tld)) {
            commonDomainItems.push(`${brandVariants.exact}${tld}`);
          }
        });

        // Затем withCasino варианты
        commonDomains.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.withCasino, tld)) {
            commonDomainItems.push(`${brandVariants.withCasino}${tld}`);
          }
        });

        // Затем withHyphen варианты (только если бренд из 2+ слов)
        if (isTwoWordBrand) {
          commonDomains.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.withHyphen, tld)) {
              commonDomainItems.push(`${brandVariants.withHyphen}${tld}`);
            }
          });
        }

        // Затем exactHyphenCasino варианты
        commonDomains.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exactHyphenCasino, tld)) {
            commonDomainItems.push(`${brandVariants.exactHyphenCasino}${tld}`);
          }
        });
      }
    }

    // Добавляем заголовок и все глобальные домены (включая .casino)
    if (commonDomainItems.length > 0) {
      newLines.push({ type: 'header', text: 'Глобальные домены' });
      commonDomainItems.forEach(item => {
        newLines.push({ type: 'item', text: item });
      });
    }

    // ЛОКАЛЬНЫЕ ДОМЕНЫ
    if (localDomainsList.length > 0) {
      newLines.push({ type: 'header', text: 'Локальные домены' });

      const localDomainItems: string[] = [];

      // Та же логика для локальных доменов
      if (brandVariants.containsCasinoWord) {
        // Показываем withCasino и exactHyphenCasino варианты
        localDomainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.withCasino, tld)) {
            localDomainItems.push(`${brandVariants.withCasino}${tld}`);
          }
        });

        // Добавляем exactHyphenCasino варианты
        localDomainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exactHyphenCasino, tld)) {
            localDomainItems.push(`${brandVariants.exactHyphenCasino}${tld}`);
          }
        });
      } else {
        // Для брендов без слова "casino" показываем все варианты

        // Сначала exact варианты
        localDomainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exact, tld)) {
            localDomainItems.push(`${brandVariants.exact}${tld}`);
          }
        });

        // Затем withCasino варианты
        localDomainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.withCasino, tld)) {
            localDomainItems.push(`${brandVariants.withCasino}${tld}`);
          }
        });

        // Затем withHyphen варианты (только если бренд из 2+ слов)
        if (isTwoWordBrand) {
          localDomainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.withHyphen, tld)) {
              localDomainItems.push(`${brandVariants.withHyphen}${tld}`);
            }
          });
        }

        // Затем exactHyphenCasino варианты
        localDomainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exactHyphenCasino, tld)) {
            localDomainItems.push(`${brandVariants.exactHyphenCasino}${tld}`);
          }
        });
      }

      // Добавляем отсортированные items
      localDomainItems.forEach(item => {
        newLines.push({ type: 'item', text: item });
      });
    }

    // ОБРАТНОЕ НАЗВАНИЕ (если начинается с casino)
    if (cleanBrand.startsWith('casino')) {
      newLines.push({ type: 'header', text: 'Обратное название' });

      const reversedBrand = cleanBrand.replace(/^casino/, '');
      if (reversedBrand) {
        const reversedExact = reversedBrand.replace(/[-\s]/g, '');
        const reversedWithHyphen = reversedBrand.replace(/\s+/g, '-');

        const reverseItems: string[] = [];

        // Для обратного названия: exact -> withCasino -> withHyphen -> exactHyphenCasino
        if (!shouldExcludeVariant(reversedExact, '.com')) {
          reverseItems.push(`${reversedExact}.com`);
        }

        let reversedWithCasino = reversedExact;
        if (!reversedExact.endsWith('casino')) {
          reversedWithCasino = reversedExact + 'casino';
        }
        if (!shouldExcludeVariant(reversedWithCasino, '.com')) {
          reverseItems.push(`${reversedWithCasino}.com`);
        }

        if ((/\s+/.test(reversedBrand) || /-/.test(reversedBrand)) &&
          !shouldExcludeVariant(reversedWithHyphen, '.com')) {
          reverseItems.push(`${reversedWithHyphen}.com`);
        }

        // Добавляем exactHyphenCasino для обратного названия
        let reversedExactHyphenCasino = reversedExact;
        if (!reversedExact.endsWith('casino')) {
          reversedExactHyphenCasino = reversedExact + '-casino';
        }
        if (!shouldExcludeVariant(reversedExactHyphenCasino, '.com')) {
          reverseItems.push(`${reversedExactHyphenCasino}.com`);
        }

        // Добавляем отсортированные items
        reverseItems.forEach(item => {
          newLines.push({ type: 'item', text: item });
        });
      }
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
          placeholder="Введите название бренда (например: pelican или sloto king casino)..."
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

        {/* Глобальные домены */}
        <div className="domainsGroup">
          <div className="domainsHeader">
            <label htmlFor="globalDomains">
              Глобальные домены
            </label>
          </div>
          <textarea
            id="globalDomains"
            value={globalDomainsInput}
            onChange={(e) => setGlobalDomainsInput(e.target.value)}
            placeholder="Введите глобальные доменные зоны..."
            className="domainsTextarea"
            rows={4}
          />
          <div className="domainsHint">
            Пример [ .casino .bet .com .org .net .io .win .vegas .bingo ] - каждый с новой строки
          </div>
        </div>

        {/* Локальные домены (включая псевдо-локальные) */}
        <div className="domainsGroup">
          <div className="domainsHeader">
            <label htmlFor="localDomains">
              Локальные + Псевдо-локальные домены
            </label>
          </div>
          <textarea
            id="localDomains"
            value={localDomainsInput}
            onChange={(e) => setLocalDomainsInput(e.target.value)}
            placeholder="Введите локальные доменные зоны..."
            className="domainsTextarea"
            rows={4}
          />
          <div className="domainsHint">
            Пример [ .uk .co.uk .org.uk .me.uk .gb.net .uk.com .uk.net ] - каждый с новой строки
          </div>
        </div>

      </div>

      <div className="outputContainer">
        <div className="outputHeader">
          <h3>Результаты подбора доменов</h3>
          <div className="outputActions">
            <span className="counter">
              {outputLines.filter(line => !line.startsWith('Специальные') && !line.startsWith('Глобальные') && !line.startsWith('Локальные') && !line.startsWith('Обратное')).length} вариантов
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
            <div className="emptyHint">
              Примеры: pelican, sloto king, sloto king casino, Spinbuddha
            </div>
          </div>
        ) : (
          <div className="output">
            {outputLines.map((line, index) => {
              const isHeader = line.startsWith('Специальные') || line.startsWith('Глобальные') || line.startsWith('Локальные') || line.startsWith('Обратное');
              const isItem = !isHeader;

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