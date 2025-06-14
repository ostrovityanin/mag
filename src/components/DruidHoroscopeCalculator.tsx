
import React from "react";
import { TreePine } from "lucide-react";
import { DruidHoroscopeForm } from "./DruidHoroscopeForm";

// Текст о друидском гороскопе, даём html для верстки в scrollable блок
const DESCRIPTION = `
<h2 class="font-playfair text-2xl text-green-900 mb-3">Что такое друидский гороскоп?</h2>
<p class="mb-3">
Друидский гороскоп (также известный как кельтский древесный гороскоп) – это система соответствия дней рождения определённым деревьям, которую приписывают древним кельтским друидам. Согласно этой традиции, каждый человек имеет дерево-покровитель, определяемое датой его рождения. Друиды глубоко почитали деревья и верили, что люди, подобно деревьям, обладают особыми чертами характера, сильными и слабыми сторонами, и нуждаются в определённых «условиях» жизни. Каждое дерево, в представлении друидов, наделяло родившихся под ним людей своей энергетикой и качествами.
</p>
<h3 class="font-semibold text-green-800 mt-6 mb-2 text-lg">Происхождение и принципы</h3>
<p class="mb-3">
Считается, что истоки этого гороскопа уходят в традиции древних галлов и друидов, жрецов-кельтов, живших в лесах Европы. Друиды не столько предсказывали судьбу по звёздам, сколько наблюдали за природой. Они отмечали связь между периодом рождения человека и характером дерева, растущего в это время года. В результате родился календарь, где год делится на интервалы, каждому из которых соответствует определённое дерево. Первоначально кельты пользовались лунным календарём (по некоторым теориям — календарём из 13 месяцев по 28 дней плюс особые дни солнцестояний и равноденствий). Современные версии друидского гороскопа адаптированы под привычный солнечный календарь из 12 месяцев и 365 дней. Всего знаков насчитывается 21, и они охватывают все дни года без пропусков (в некоторых вариантах встречается 22 знака). Четырём особым дням года — дням солнцестояний и равноденствий — соответствуют отдельные деревья (например, Дуб на весеннее равноденствие). Остальные знаки распределены парами дат, примерно по два периода в году для каждого дерева (иногда по четыре коротких периода, как в случае с Тополем). Такая симметричная структура подчёркивает цикличность природы и смену сезонов.
</p>
<p class="mb-3">
Важно понимать, что сам друидский гороскоп в том виде, в каком его сейчас публикуют, – скорее всего поздняя реконструкция или даже вымысел более поздних авторов (XVIII–XX веков). Прямых свидетельств от древних друидов о таком календаре не сохранилось. Тем не менее, эта система укоренилась в популярной культуре благодаря своей поэтичности и мудрости природы. Она предлагает аллегорический взгляд на характер человека через образы деревьев.
</p>
<h3 class="font-semibold text-green-800 mt-6 mb-2 text-lg">Как пользоваться этим гороскопом?</h3>
<p class="mb-3">
Чтобы воспользоваться друидским гороскопом, достаточно найти в календаре свой день рождения и узнать, какое дерево является вашим покровителем. Далее можно прочитать описание этого знака дерева – вы узнаете о предполагаемых чертах характера, сильных качествах и возможных недостатках, присущих людям вашего знака. Конечно, гороскоп носит обобщённый характер: не все качества могут точно вам соответствовать. Однако образы деревьев и связанные с ними легенды помогают лучше понять себя, увидеть свои сильные стороны и получить пищу для размышлений. Друидский гороскоп ценен не столько пророчествами, сколько возможностью установить связь с природой и своим внутренним миром. Когда вы знаете своё дерево-покровитель, можно обратить внимание на это растение в жизни: посадить его в саду, чаще любоваться им в парке или лесу, – и таким образом черпать энергию и вдохновение у своей древесной «прародины».
</p>
`;


export const DruidHoroscopeCalculator: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-stretch">
      <div className="flex flex-col md:flex-row gap-6 px-2 sm:px-4 py-8 mx-auto w-full max-w-6xl">
        {/* Sticky боковая форма/панель */}
        <div className="md:w-[370px] w-full flex-shrink-0">
          <div className="md:sticky md:top-8 md:mb-0 mb-4 z-10">
            <header className="flex flex-col items-center mb-2 animate-fade-in">
              <div className="flex items-center gap-2 text-green-800 text-xl sm:text-2xl font-extrabold mb-1 tracking-tight">
                <TreePine className="w-7 h-7 text-green-700 inline-block" />
                <span className="drop-shadow text-3xl font-playfair select-none">
                  Кельтский гороскоп деревьев
                </span>
              </div>
              <p className="text-green-700 mt-2 text-sm font-medium opacity-80 italic">
                Определите свой знак по дате рождения
              </p>
            </header>
            <DruidHoroscopeForm />
            {/* Декоративка */}
            <div className="flex justify-center mt-3 animate-fade-in">
              <div className="flex gap-1">
                <span className="inline-block text-green-800/70 text-2xl">🌱</span>
                <span className="inline-block text-green-800/70 text-xl">🍃</span>
                <span className="inline-block text-green-800/70 text-2xl">🌿</span>
                <span className="inline-block text-green-800/70 text-xl">🌳</span>
                <span className="inline-block text-green-800/70 text-2xl">🌲</span>
              </div>
            </div>
          </div>
        </div>
        {/* Текстовый блок */}
        <div className="flex-1 min-w-0">
          <div className="prose prose-green prose-sm sm:prose-base max-w-none text-gray-900 mt-3 animate-fade-in">
            <div dangerouslySetInnerHTML={{ __html: DESCRIPTION }} />
          </div>
        </div>
      </div>
      {/* Фоновый анимированный орнамент */}
      <div className="fixed left-0 right-0 bottom-0 opacity-30 pointer-events-none z-0">
        <div className="flex justify-center animate-fade-in-slow">
          <span className="text-6xl sm:text-8xl select-none text-emerald-100">🌿</span>
          <span className="text-5xl sm:text-8xl select-none text-emerald-200 -ml-6">🌳</span>
          <span className="text-7xl sm:text-8xl select-none text-emerald-100 -ml-4">🍀</span>
        </div>
      </div>
    </div>
  );
};
