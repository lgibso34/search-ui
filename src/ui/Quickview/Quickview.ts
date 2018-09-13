import 'styling/_Quickview';
import PopperJs from 'popper.js';
import { QuickviewEvents } from '../../events/QuickviewEvents';
import { ResultListEvents } from '../../events/ResultListEvents';
import { ModalBox as ModalBoxModule } from '../../ExternalModulesShim';
import { exportGlobally } from '../../GlobalExports';
import { QueryStateModel } from '../../models/QueryStateModel';
import { IQueryResult } from '../../rest/QueryResult';
import { l } from '../../strings/Strings';
import { AccessibleButton } from '../../utils/AccessibleButton';
import { $$, Dom } from '../../utils/Dom';
import { DomUtils } from '../../utils/DomUtils';
import { StringUtils } from '../../utils/StringUtils';
import { SVGDom } from '../../utils/SVGDom';
import { SVGIcons } from '../../utils/SVGIcons';
import { Utils } from '../../utils/Utils';
import { analyticsActionCauseList } from '../Analytics/AnalyticsActionListMeta';
import { Component } from '../Base/Component';
import { ComponentOptions, ComponentOptionsType } from '../Base/ComponentOptions';
import { IInitializationParameters, Initialization } from '../Base/Initialization';
import { IResultsComponentBindings } from '../Base/ResultsComponentBindings';
import { TemplateComponentOptions } from '../Base/TemplateComponentOptions';
import { Template } from '../Templates/Template';
import { DefaultQuickviewTemplate } from './DefaultQuickviewTemplate';
import { QuickviewDocument } from './QuickviewDocument';

export interface IQuickviewOptions {
  title?: string;
  showDate?: boolean;
  contentTemplate?: Template;
  enableLoadingAnimation?: boolean;
  loadingAnimation?: HTMLElement | Promise<HTMLElement>;
  alwaysShow?: boolean;
}

interface IQuickviewOpenerObject {
  content: Promise<Dom>;
  loadingAnimation: HTMLElement | Promise<HTMLElement>;
}

/**
 * The `Quickview` component renders a button/link which the end user can click to open a modal box containing certain
 * information about a result. Most of the time, this component references a
 * [`QuickviewDocument`]{@link QuickviewDocument} in its [`contentTemplate`]{@link Quickview.options.contentTemplate}.
 *
 * **Notes:**
 * > - `Quickview` is not meant to replace a [ResultLink]{@link ResultLink} to access an item; it has certain limitations (e.g., custom styles and embedded
 * images/links may not work as expected in a `Quickview`).
 * > - You can change the appearance of the `Quickview` link/button by adding elements in the inner HTML of its `div`.
 * > - You can change the content of the `Quickview` modal box link by specifying a template `id` or CSS selector (see
 * > the [`contentTemplate`]{@link Quickview.options.contentTemplate} option).
 * > - When using Coveo for Salesforce 3.16, in an environment compliant with LockerService, ensure you use `CoveoSalesforceQuickview` (see [Changing the Default Quick View in Coveo for Salesforce](https://docs.coveo.com/en/1234/)).
 *
 * **Example:**
 * ```html
 * [ ... ]
 *
 * <script class='result-template' type='text/underscore' id='myContentTemplateId'>
 *   <div>
 *     <span>This content will be displayed when then end user opens the quickview modal box. It could also include other Coveo component, and use core helpers.</span>
 *     <table class="CoveoFieldTable">
 *       <tr data-field="@liboardshorttitle" data-caption="Board" />
 *       <tr data-field="@licategoryshorttitle" data-caption="Category" />
 *       <tr data-field="@sysauthor" data-caption="Author" />
 *     </table>
 *   </div>
 * </script>
 *
 * [ ... ]
 *
 * <div class='CoveoResultList'>
 *   <script class='result-template' type='text/underscore' id='myResultTemplateId'>
 *
 *   [ ... ]
 *
 *     <!-- The `myContentTemplateId` template applies when displaying content in the quickview modal box. -->
 *       <div class='CoveoQuickview' data-template-id='myContentTemplateId'>
 *         <!-- This changes the appearance of the Quickview button itself in the results -->
 *         <span>Click here for a quickview</span>
 *       </div>
 *   </script>
 *
 *   [ ... ]
 *
 * <!-- Note that simply including `<div class='CoveoQuickview'></div>` in the markup will be enough most of the time, since the component includes a default template and a default button appearance. -->
 * ```
 *
 * This component is a result template component (see [Result Templates](https://developers.coveo.com/x/aIGfAQ)).
 */
export class Quickview extends Component {
  static ID = 'Quickview';

  static doExport = () => {
    exportGlobally({
      Quickview: Quickview,
      QuickviewDocument: QuickviewDocument
    });
  };

  /**
   * @componentOptions
   */
  static options: IQuickviewOptions = {
    /**
     * Specifies whether to always show the `Quickview` button/link, even when the index body of an item is empty.
     *
     * In such cases, the [`contentTemplate`]{@link Quickview.options.contentTemplate} defines what appears in the
     * `Quickview` modal box. Consequently, if there is no quickview for the item, you *MUST* specify a custom
     * `contentTemplate`, otherwise the component will throw an error when opened.
     *
     * Default value is `false`.
     */
    alwaysShow: ComponentOptions.buildBooleanOption({ defaultValue: false }),

    /**
     * Specifies the title that should appear in the `Quickview` modal box header.
     *
     * Default value is undefined, which is equivalent to the empty string.
     */
    title: ComponentOptions.buildStringOption(),

    /**
     * Specifies whether to display the item date in the `Quickview` modal box header.
     *
     * Default value is `true`.
     */
    showDate: ComponentOptions.buildBooleanOption({ defaultValue: true }),

    /**
     * Specifies whether to enable the loading animation.
     *
     * See also [`loadingAnimation`]{Quickview.options.loadingAnimation}.
     *
     * Default value is `true`.
     */
    enableLoadingAnimation: ComponentOptions.buildBooleanOption({ defaultValue: true }),

    /**
     * Specifies a custom template to use when displaying content in the `Quickview` modal box.
     *
     * **Note:**
     * > You can use [`CoreHelpers`]{@link ICoreHelpers} methods in your content template.
     *
     * You can specify a previously registered template to use either by referring to its HTML `id` attribute or to a
     * CSS selector (see [`TemplateCache`]{@link TemplateCache}).
     *
     * **Example:**
     *
     * * Specifying a previously registered template by referring to its HTML `id` attribute:
     *
     * ```html
     * <div class="CoveoQuickview" data-template-id="myContentTemplateId"></div>
     * ```
     *
     * * Specifying a previously registered template by referring to a CSS selector:
     *
     * ```html
     * <div class='CoveoQuickview' data-template-selector=".myContentTemplateSelector"></div>
     * ```
     *
     * If you do not specify a custom content template, the component uses its default template.
     */
    contentTemplate: TemplateComponentOptions.buildTemplateOption({
      selectorAttr: 'data-template-selector',
      idAttr: 'data-template-id'
    }),

    /**
     * If [`enableLoadingAnimation`]{@link Quickview.options.enableLoadingAnimation} is `true`, specifies a custom
     * animation to display while the content of the quickview modal window is loading. You can either specify the CSS
     * selector of the HTML element you wish to display, or the `id` of a previously registered template (see
     * [`TemplateCache`]{@link TemplateCache}).
     *
     * See [Branding Customization - Customizing the Quickview Loading Animation](https://developers.coveo.com/x/EoGfAQ#BrandingCustomization-CustomizingtheQuickviewLoadingAnimation).
     *
     * **Examples:**
     *
     * * Specifying the CSS selector of the HTML element to display:
     *
     * ```html
     * <div class="CoveoQuickview" data-loading-animation-selector=".my-loading-animation"></div>
     * ```
     *
     * * Specifying the `id` of a previously registered template:
     *
     * ```html
     * <div class="CoveoQuickview" data-loading-animation-template-id="my-loading-animation-template"></div>
     * ```
     *
     * By default, the loading animation is a Coveo animation, which you can customize with CSS (see
     * [Branding Customization - Customizing the Default Loading Animation](https://developers.coveo.com/x/EoGfAQ#BrandingCustomization-CustomizingtheDefaultLoadingAnimation).
     */
    loadingAnimation: ComponentOptions.buildOption<HTMLElement | Promise<HTMLElement>>(
      ComponentOptionsType.NONE,
      (element: HTMLElement) => {
        const loadingAnimationSelector = element.getAttribute('data-loading-animation-selector');
        if (loadingAnimationSelector != null) {
          const loadingAnimation = $$(document.documentElement).find(loadingAnimationSelector);
          if (loadingAnimation != null) {
            $$(loadingAnimation).detach();
            return loadingAnimation;
          }
        }
        const id = element.getAttribute('data-loading-animation-template-id');
        if (id != null) {
          const loadingAnimationTemplate = TemplateComponentOptions.loadResultTemplateFromId(id);
          if (loadingAnimationTemplate) {
            return loadingAnimationTemplate.instantiateToElement(undefined, {
              checkCondition: false
            });
          }
        }
        return DomUtils.getBasicLoadingAnimation();
      }
    )
  };

  public static resultCurrentlyBeingRendered: IQueryResult = null;

  private modalbox: Coveo.ModalBox.ModalBox;

  /**
   * Creates a new `Quickview` component.
   * @param element The HTMLElement on which to instantiate the component.
   * @param options The options for the `Quickview` component.
   * @param bindings The bindings that the component requires to function normally. If not set, these will be
   * automatically resolved (with a slower execution time).
   * @param result The result to associate the component with.
   * @param ModalBox The quickview modal box.
   */
  constructor(
    public element: HTMLElement,
    public options?: IQuickviewOptions,
    public bindings?: IResultsComponentBindings,
    public result?: IQueryResult,
    private ModalBox = ModalBoxModule
  ) {
    super(element, Quickview.ID, bindings);
    this.options = ComponentOptions.initComponentOptions(element, Quickview, options);

    if (this.options.contentTemplate == null) {
      this.options.contentTemplate = new DefaultQuickviewTemplate();
    }

    // If there is no content inside the Quickview div,
    // we need to add something that will show up in the result template itself
    if (/^\s*$/.test(this.element.innerHTML)) {
      this.buildContent();
    }

    this.bindClick(result);
    if (this.bindings.resultElement) {
      this.bind.on(this.bindings.resultElement, ResultListEvents.openQuickview, () => this.open());
    }
  }

  private buildContent() {
    const icon = this.buildIcon();
    const tooltip = this.buildTootip(icon);

    const content = $$('div');
    content.append(icon);
    content.append(tooltip);

    $$(this.element).append(content.el);
  }

  private buildIcon() {
    const icon = $$('div', { className: 'coveo-icon-for-quickview' }, SVGIcons.icons.quickview).el;
    SVGDom.addClassToSVGInContainer(icon, 'coveo-icon-for-quickview-svg');
    return icon;
  }

  private buildTootip(icon: HTMLElement) {
    const tooltip = $$('div', { className: 'coveo-caption-for-icon', tabindex: 0 }, 'Quickview'.toLocaleString()).el;
    const arrow = $$('div').el;
    tooltip.appendChild(arrow);

    this.buildPopper(icon, tooltip, arrow);
    return tooltip;
  }

  private buildPopper(icon: HTMLElement, tooltip: HTMLElement, arrow: HTMLElement) {
    const popperReference = new PopperJs(icon, tooltip, {
      placement: 'bottom',
      modifiers: {
        preventOverflow: {
          boundariesElement: $$(this.root).el,
          padding: 0
        },
        arrow: {
          element: arrow
        },
        // X,Y offset of the tooltip relative to the icon
        offset: {
          offset: '0,8'
        }
      }
    });

    $$(this.element).on('mouseover', () => {
      popperReference.update();
    });
  }

  /**
   * Opens the `Quickview` modal box.
   */
  public open() {
    if (this.modalbox == null) {
      // To prevent the keyboard from opening on mobile if the search bar has focus
      Quickview.resultCurrentlyBeingRendered = this.result;
      // activeElement does not exist in LockerService
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        $$(document.activeElement as HTMLElement).trigger('blur');
      }

      const openerObject = this.prepareOpenQuickviewObject();
      return this.createModalBox(openerObject).then(() => {
        this.bindQuickviewEvents(openerObject);
        this.animateAndOpen();
        this.logUsageAnalyticsEvent();
        this.queryStateModel.set(QueryStateModel.attributesEnum.quickview, this.getHashId());
        Quickview.resultCurrentlyBeingRendered = null;
      });
    }
  }

  /**
   * Closes the `Quickview` modal box.
   */
  public close() {
    if (this.modalbox != null) {
      this.modalbox.close();
      this.modalbox = null;
    }
  }

  public getHashId() {
    return this.result.queryUid + '.' + this.result.index + '.' + StringUtils.hashCode(this.result.uniqueId);
  }

  private logUsageAnalyticsEvent() {
    this.usageAnalytics.logClickEvent(
      analyticsActionCauseList.documentQuickview,
      {
        author: Utils.getFieldValue(this.result, 'author'),
        documentURL: this.result.clickUri,
        documentTitle: this.result.title
      },
      this.result,
      this.element
    );
  }

  private bindClick(result: IQueryResult) {
    if (typeof result.hasHtmlVersion == 'undefined' || result.hasHtmlVersion || this.options.alwaysShow) {
      const clickAction = () => this.open();

      new AccessibleButton()
        .withElement(this.element)
        .withSelectAction(clickAction)
        .withLabel(l('Quickview'))
        .withOwner(this.bind)
        .build();
    } else {
      this.element.style.display = 'none';
    }
  }

  private bindQuickviewEvents(openerObject: IQuickviewOpenerObject) {
    $$(this.modalbox.content).on(QuickviewEvents.quickviewLoaded, async () => {
      const anim = await openerObject.loadingAnimation;
      $$(anim).remove();
    });
  }

  private animateAndOpen() {
    const quickviewDocument = $$(this.modalbox.modalBox).find('.' + Component.computeCssClassName(QuickviewDocument));
    if (quickviewDocument) {
      Initialization.dispatchNamedMethodCallOrComponentCreation('open', quickviewDocument, null);
    }
  }

  private createModalBox(openerObject: IQuickviewOpenerObject) {
    const computedModalBoxContent = $$('div');
    computedModalBoxContent.addClass('coveo-computed-modal-box-content');
    return openerObject.content.then(builtContent => {
      computedModalBoxContent.append(builtContent.el);
      const title = DomUtils.getQuickviewHeader(
        this.result,
        {
          showDate: this.options.showDate,
          title: this.options.title
        },
        this.bindings
      ).el;

      this.modalbox = this.ModalBox.open(computedModalBoxContent.el, {
        title,
        className: 'coveo-quick-view',
        validation: () => {
          this.closeQuickview();
          return true;
        },
        body: this.element.ownerDocument.body,
        sizeMod: 'big'
      });
      return computedModalBoxContent;
    });
  }

  private prepareOpenQuickviewObject() {
    const loadingAnimation = this.options.loadingAnimation;
    return {
      loadingAnimation: loadingAnimation,
      content: this.prepareQuickviewContent(loadingAnimation)
    };
  }

  private async prepareQuickviewContent(loadingAnimation: HTMLElement | Promise<HTMLElement>): Promise<Dom> {
    const domContent = await this.instantiateTemplateToDom();

    const initOptions = this.searchInterface.options;
    const initParameters: IInitializationParameters = {
      options: initOptions,
      bindings: this.getBindings(),
      result: this.result
    };

    await Initialization.automaticallyCreateComponentsInside(domContent.el, initParameters).initResult;

    const containsQuickviewDocumentAndCustomAnimation = () =>
      domContent.find(`.${Component.computeCssClassName(QuickviewDocument)}`) != undefined && this.options.enableLoadingAnimation;

    if (containsQuickviewDocumentAndCustomAnimation()) {
      if (loadingAnimation instanceof HTMLElement) {
        domContent.prepend(loadingAnimation);
      } else if (loadingAnimation instanceof Promise) {
        loadingAnimation.then(anim => {
          domContent.prepend(anim);
        });
      }
    }
    return domContent;
  }

  private async instantiateTemplateToDom(): Promise<Dom> {
    let templateInstantiated: HTMLElement;
    try {
      templateInstantiated = await this.options.contentTemplate.instantiateToElement(this.result);
    } catch (e) {
      this.logger.warn(e);
    } finally {
      if (!templateInstantiated) {
        this.logger.warn(
          'An unexpected error happened while trying to render a custom template quickview, fallbacking on default quickview template...',
          this.options.contentTemplate
        );
        templateInstantiated = await new DefaultQuickviewTemplate().instantiateToElement(this.result);
      }
    }
    return $$(templateInstantiated);
  }

  private closeQuickview() {
    this.queryStateModel.set(QueryStateModel.attributesEnum.quickview, '');
  }
}
Initialization.registerAutoCreateComponent(Quickview);