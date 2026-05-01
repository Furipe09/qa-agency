Feature: Checkout de E-commerce
  Como um cliente da loja
  Eu quero finalizar minha compra com segurança
  Para receber meus produtos corretamente

  Scenario: Sucesso na compra com cartão de crédito
    Given que o carrinho contém itens válidos
    And o cartão de crédito "4111 1111 1111 1111" possui saldo
    When o usuário clica em "Finalizar Compra"
    Then o sistema deve processar o pagamento
    And exibir a mensagem "Pedido realizado com sucesso!"

  Scenario: Falha por saldo insuficiente
    Given que o carrinho contém itens no valor de R$ 500,00
    And o cartão de crédito possui saldo de apenas R$ 100,00
    When o usuário tenta finalizar o checkout
    Then o sistema deve exibir o erro "Saldo insuficiente"
    And o pedido não deve ser criado no banco de dados

  Scenario: Tentativa de checkout com carrinho vazio
    Given que o usuário não adicionou nenhum item ao carrinho
    When ele acessa a página de checkout
    Then o botão "Finalizar Compra" deve estar desabilitado
    And deve aparecer o aviso "Seu carrinho está vazio"