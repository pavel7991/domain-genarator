import React, { useState, useRef } from 'react';
import './styles/App.css';

function App() {
  const [inputValue, setInputValue] = useState<string>('');
  const [globalDomainsInput, setGlobalDomainsInput] = useState<string>('.casino .com .org .win .bingo');
  const [localDomainsInput, setLocalDomainsInput] = useState<string>('.uk .co.uk .org.uk');
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRun = () => {
    if (!inputValue.trim()) {
      inputRef.current?.focus();
      return;
    }

    // Подготовка бренда
    const originalBrand = inputValue.trim();

    // Проверяем, содержит ли ввод слово "casino" как отдельное слово в конце
    const containsCasinoAtEndAsWord = /\bcasino\b$/i.test(originalBrand);

    // Проверяем, заканчивается ли бренд на "casino" (слитно)
    const endsWithCasino = /casino$/i.test(originalBrand.replace(/[-\s]/g, ''));

    // Бренд заканчивается на casino (любым способом)
    const brandEndsWithCasino = containsCasinoAtEndAsWord || endsWithCasino;

    // Бренд содержит "casino" в начале или середине (но не в конце)
    const containsCasinoInName = /casino/i.test(originalBrand) && !brandEndsWithCasino;

    // Для случаев, заканчивающихся на casino, нужны ДВА варианта:
    // 1. Бренд БЕЗ casino в конце (для casino- префиксов) - "tucan"
    // 2. Бренд С casino в конце (для остальных вариантов) - "tucancasino"

    let brandWithoutCasino; // Для casino- префиксов
    let brandWithCasinoAtEnd; // Для остальных вариантов

    if (brandEndsWithCasino) {
      // Когда заканчивается на casino

      if (containsCasinoAtEndAsWord) {
        // "tucan casino" - отдельное слово
        brandWithoutCasino = originalBrand.toLowerCase().replace(/\s+casino\b\s*/i, '').trim();
        brandWithCasinoAtEnd = brandWithoutCasino.replace(/[-\s]/g, '') + 'casino';
      } else {
        // "tucancasino" - слитно
        brandWithoutCasino = originalBrand.toLowerCase().replace(/casino$/i, '');
        brandWithCasinoAtEnd = originalBrand.toLowerCase();
      }
    } else {
      // Когда НЕ заканчивается на casino
      brandWithoutCasino = originalBrand.toLowerCase().replace(/\s+casino\s*/i, '');
      brandWithCasinoAtEnd = brandWithoutCasino.replace(/[-\s]/g, '');
    }

    // Очищаем от пробелов и дефисов
    brandWithoutCasino = brandWithoutCasino.replace(/[-\s]/g, '');

    const cleanBrand = brandWithoutCasino;
    const isTwoWordBrand = /\s+/.test(originalBrand.replace(/\bcasino\b/gi, '').trim()) || /-/.test(originalBrand);

    // Основные варианты бренда
    const brandExact = cleanBrand;
    const brandWithHyphen = originalBrand.toLowerCase().replace(/\s+/g, '-').replace(/\bcasino\b/gi, '').trim();

    // withCasino варианты
    let brandWithCasino = brandEndsWithCasino ? brandWithCasinoAtEnd : (brandExact + 'casino');

    // Вариант: exact + "-casino"
    let brandExactHyphenCasino = brandExact + '-casino';

    // Вариант: "casino" + brand (слитный)
    let casinoPrefixBrandSlit = null;
    if (!containsCasinoInName && !brandExact.startsWith('casino')) {
      casinoPrefixBrandSlit = 'casino' + brandExact;
    }

    // Вариант: "casino-" + brand (дефисный)
    let casinoPrefixBrand = null;
    if (!containsCasinoInName && !brandExact.startsWith('casino')) {
      casinoPrefixBrand = 'casino-' + brandExact;
    }

    const brandVariants = {
      exact: brandExact,
      exactWithCasino: brandWithCasinoAtEnd,
      withHyphen: brandWithHyphen,
      withCasino: brandWithCasino,
      exactHyphenCasino: brandExactHyphenCasino,
      casinoPrefixBrandSlit: casinoPrefixBrandSlit,
      casinoPrefixBrand: casinoPrefixBrand,
      brandEndsWithCasino: brandEndsWithCasino,
      containsCasinoInName: containsCasinoInName
    };

    // Парсинг доменов - поддерживает и переносы строк, и пробелы
    const parseDomains = (input: string): string[] => {
      return input
        .split(/[\n\s]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(tld => {
          const cleanTld = tld.replace(/^\.+/, '.');
          return cleanTld.startsWith('.') ? cleanTld : `.${cleanTld}`;
        })
        .filter((tld, index, self) => self.indexOf(tld) === index);
    };

    const globalDomainsList = parseDomains(globalDomainsInput);
    const localDomainsList = parseDomains(localDomainsInput);

    // Список ВСЕХ возможных доменов из ввода пользователя
    const allUserDomains = [...globalDomainsList, ...localDomainsList];

    // Разделяем глобальные домены по типам - теперь проверяем только те, что есть у пользователя
    const specialDomains = ['.bet', '.win', '.vegas', '.bingo'];
    const casinoDomain = '.casino';

    // Оставляем только те специальные домены, которые есть в списке пользователя
    const availableSpecialDomains = specialDomains.filter(domain =>
      allUserDomains.includes(domain)
    );

    const commonDomains = globalDomainsList.filter(
      domain => !availableSpecialDomains.includes(domain) && domain !== casinoDomain
    );

    const newLines: Array<{type: 'header' | 'item', text: string}> = [];

    // Вспомогательная функция для проверки, нужно ли исключать вариант
    const shouldExcludeVariant = (brand: string, domain: string) => {
      // Если casino часть имени бренда (в середине или начале), исключаем домены .casino
      if (containsCasinoInName && domain === '.casino') {
        return true;
      }

      // Исключаем варианты, где бренд заканчивается на casino И домен .casino
      if (domain === '.casino' && brand.toLowerCase().endsWith('casino')) {
        return true;
      }

      // Исключаем варианты casino-casino... (двойной префикс)
      if (brand.toLowerCase().startsWith('casino-casino')) {
        return true;
      }

      // Исключаем варианты, где casino часть имени бренда И добавляется еще casino
      if (containsCasinoInName && (brand.toLowerCase().includes('casinocasino') || brand.toLowerCase().includes('casino-casino'))) {
        return true;
      }

      return false;
    };

    // ПРИОРИТЕТ №1: Специальные зоны (.bet, .win, .vegas, .bingo) - если есть окончание
    // Показываем специальные зоны только если бренд НЕ содержит слово casino в оригинальном вводе
    const hasSpecialEnding = !brandEndsWithCasino && !containsCasinoInName && availableSpecialDomains.some(domain => {
      const ending = domain.substring(1);
      return brandVariants.exact.endsWith(ending);
    });

    if (hasSpecialEnding && availableSpecialDomains.length > 0) {
      newLines.push({ type: 'header', text: 'Специальные зоны (.bet/.win/.vegas/.bingo)' });

      const specialZoneItems: string[] = [];

      // Проверяем только те специальные домены, которые есть у пользователя
      availableSpecialDomains.forEach(domain => {
        const ending = domain.substring(1);
        if (brandVariants.exact.endsWith(ending)) {
          const brandWithoutEnding = brandVariants.exact.replace(new RegExp(`${ending}$`, 'i'), '');
          if (brandWithoutEnding && !shouldExcludeVariant(brandWithoutEnding, domain)) {
            specialZoneItems.push(`${brandWithoutEnding}${domain}`);
          }
        }
      });

      // Добавляем только если есть результаты
      if (specialZoneItems.length > 0) {
        specialZoneItems.forEach(item => {
          newLines.push({ type: 'item', text: item });
        });
      } else {
        // Убираем заголовок, если нет результатов
        newLines.pop();
      }
    }

    // Общая функция для генерации доменов с усиленной проверкой
    const generateDomains = (domainsList: string[], brandVariants: any, brandEndsWithCasino: boolean, containsCasinoInName: boolean, isTwoWordBrand: boolean) => {
      const items: string[] = [];

      if (containsCasinoInName) {
        // Когда casino часть имени бренда (casino2024, goldencasino1) - только базовые варианты

        // 1. Базовый вариант (casino2024.com, goldencasino1.com и т.д.)
        domainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exact, tld)) {
            items.push(`${brandVariants.exact}${tld}`);
          }
        });

        // НЕ генерируем никаких вариантов с дополнительным "casino"!

      } else if (brandEndsWithCasino) {
        // Когда бренд заканчивается на casino (tucan casino или tucancasino) - все варианты

        // 1. Базовый вариант С casino (tucancasino.com)
        domainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exactWithCasino, tld)) {
            items.push(`${brandVariants.exactWithCasino}${tld}`);
          }
        });

        // 2. Вариант без casino + "-casino" (tucan-casino.com)
        domainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exactHyphenCasino, tld)) {
            items.push(`${brandVariants.exactHyphenCasino}${tld}`);
          }
        });

        // 3. casino + brand без casino (слитный) (casinotucan.com)
        if (brandVariants.casinoPrefixBrandSlit) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.casinoPrefixBrandSlit, tld)) {
              items.push(`${brandVariants.casinoPrefixBrandSlit}${tld}`);
            }
          });
        }

        // 4. casino- + brand без casino (дефисный) (casino-tucan.com)
        if (brandVariants.casinoPrefixBrand) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.casinoPrefixBrand, tld)) {
              items.push(`${brandVariants.casinoPrefixBrand}${tld}`);
            }
          });
        }

      } else {
        // Когда ввод НЕ содержит "casino" вообще - полная генерация

        // 1. tucan.com
        domainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exact, tld)) {
            items.push(`${brandVariants.exact}${tld}`);
          }
        });

        // 2. tucancasino.com
        if (brandVariants.withCasino) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.withCasino, tld)) {
              items.push(`${brandVariants.withCasino}${tld}`);
            }
          });
        }

        // 3. tucan-casino.com
        if (brandVariants.exactHyphenCasino) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.exactHyphenCasino, tld)) {
              items.push(`${brandVariants.exactHyphenCasino}${tld}`);
            }
          });
        }

        // 4. casinotucan.com (слитный)
        if (brandVariants.casinoPrefixBrandSlit) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.casinoPrefixBrandSlit, tld)) {
              items.push(`${brandVariants.casinoPrefixBrandSlit}${tld}`);
            }
          });
        }

        // 5. casino-tucan.com (дефисный)
        if (brandVariants.casinoPrefixBrand) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.casinoPrefixBrand, tld)) {
              items.push(`${brandVariants.casinoPrefixBrand}${tld}`);
            }
          });
        }

        // 6. Дефисный вариант для двухсловных (tucan-king.com)
        if (isTwoWordBrand) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.withHyphen, tld)) {
              items.push(`${brandVariants.withHyphen}${tld}`);
            }
          });
        }
      }

      return items;
    };

    // ГЛОБАЛЬНЫЕ ДОМЕНЫ (включая .casino)
    const commonDomainItems: string[] = [];

    // Добавляем .casino только если он есть в списке пользователя И casino НЕ часть имени
    if (allUserDomains.includes('.casino') && !containsCasinoInName) {
      // Для .casino используем brandExact (без casino)
      if (!shouldExcludeVariant(brandVariants.exact, '.casino')) {
        commonDomainItems.push(`${brandVariants.exact}.casino`);
      }

      if (isTwoWordBrand && !shouldExcludeVariant(brandVariants.withHyphen, '.casino')) {
        commonDomainItems.push(`${brandVariants.withHyphen}.casino`);
      }
    }

    // Генерируем остальные глобальные домены
    if (commonDomains.length > 0) {
      const generatedGlobalDomains = generateDomains(commonDomains, brandVariants, brandEndsWithCasino, containsCasinoInName, isTwoWordBrand);
      commonDomainItems.push(...generatedGlobalDomains);
    }

    if (commonDomainItems.length > 0) {
      newLines.push({ type: 'header', text: 'Глобальные домены' });
      commonDomainItems.forEach(item => {
        newLines.push({ type: 'item', text: item });
      });
    }

    // ЛОКАЛЬНЫЕ ДОМЕНЫ
    if (localDomainsList.length > 0) {
      const localDomainItems = generateDomains(localDomainsList, brandVariants, brandEndsWithCasino, containsCasinoInName, isTwoWordBrand);

      if (localDomainItems.length > 0) {
        newLines.push({ type: 'header', text: 'Локальные домены' });
        localDomainItems.forEach(item => {
          newLines.push({ type: 'item', text: item });
        });
      }
    }

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
            Пример: .casino .bet .com .org .net .io .win .vegas .bingo
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
            Пример: .uk .co.uk .org.uk .me.uk .gb.net .uk.com .uk.net
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